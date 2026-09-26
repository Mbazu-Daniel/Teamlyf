import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { createDecipheriv, createHash, randomUUID } from "node:crypto";
import type { Database } from "@teamlyf/db";
import { AgentSessionRepository, agentRun, agentSession, aiProviderConfig } from "@teamlyf/db";
import {
  agentContextTypeSchema,
  agentPermissionSchema,
  agentWorkspaceSchema,
  AgentToolRegistry,
  DockerAgentSandbox,
  InMemoryAgentRuntime,
  LocalWorkspaceCommandRunner,
  OpenAIChatModel,
  WorkspaceToolExecutor,
  getAgentToolsForContext,
  type AgentCheckpoint,
  type AgentEvent,
  type AgentModel,
  type AgentRuntimeState,
  type AgentRuntimeStore,
  type AgentSession,
  type AgentToolName,
} from "@teamlyf/agents";
import { and, desc, eq } from "drizzle-orm";
import { API_ENV } from "../../common/config/env.module";
import type { ApiEnv } from "../../common/config/env";
import { DATABASE } from "../../common/db/db.provider";
import { AgentEventHub } from "./agent-event.hub";
import { AgentSystemToolsService } from "./agent-system-tools.service";
import { AgentGithubToolsService } from "./agent-github-tools.service";

@Injectable()
export class AgentRuntimeService {
  private readonly runtimes = new Map<string, InMemoryAgentRuntime>();
  private readonly workspaceRunners = new Map<string, SandboxWorkspaceCommandRunner>();

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(API_ENV) private readonly env: ApiEnv,
    private readonly systemTools: AgentSystemToolsService,
    private readonly githubTools: AgentGithubToolsService,
    private readonly events: AgentEventHub,
  ) {}

  async sendMessage(organizationId: string, runId: string, memberId: string, message: string): Promise<void> {
    this.events.open(runId);
    const runtime = await this.ensureRuntime(organizationId, runId, memberId);
    await this.db.update(agentRun).set({
      status: "running",
      startedAt: new Date(),
      updatedAt: new Date(),
    }).where(and(eq(agentRun.id, runId), eq(agentRun.organizationId, organizationId)));

    try {
      const status = await runtime.sendMessage(runId, message);
      await this.db.update(agentRun).set({
        status,
        completedAt: status === "completed" ? new Date() : undefined,
        updatedAt: new Date(),
      }).where(and(eq(agentRun.id, runId), eq(agentRun.organizationId, organizationId)));
    } catch (error) {
      await this.db.update(agentRun).set({
        status: "failed",
        errorCode: "execution_failed",
        errorMessage: error instanceof Error ? error.message : String(error),
        completedAt: new Date(),
        updatedAt: new Date(),
      }).where(and(eq(agentRun.id, runId), eq(agentRun.organizationId, organizationId)));
      throw error;
    } finally {
      await this.workspaceRunners.get(runId)?.stop();
      this.workspaceRunners.delete(runId);
      this.events.close(runId);
    }
  }

  async interrupt(organizationId: string, runId: string, memberId: string) {
    const runtime = await this.ensureRuntime(organizationId, runId, memberId);
    await runtime.interrupt(runId);
    return { runId, interrupted: true };
  }

  async resume(organizationId: string, runId: string, memberId: string) {
    this.events.open(runId);
    const runtime = await this.ensureRuntime(organizationId, runId, memberId);
    const status = await runtime.resume(runId);
    return { runId, status, resumed: status !== "waiting_for_permission" };
  }

  async resolvePermission(
    organizationId: string,
    runId: string,
    memberId: string,
    requestId: string,
    decision: "once" | "always" | "reject",
  ) {
    const runtime = await this.ensureRuntime(organizationId, runId, memberId);
    await runtime.resolvePermission(runId, requestId, decision);
    return { runId, requestId, decision };
  }

  async streamEvents(organizationId: string, runId: string, memberId: string) {
    await this.requireRun(organizationId, runId, memberId);
    return this.events.stream(runId);
  }

  private async ensureRuntime(organizationId: string, runId: string, memberId: string) {
    const existing = this.runtimes.get(runId);
    if (existing) return existing;

    const run = await this.requireRun(organizationId, runId, memberId);
    const input = isRecord(run.input) ? run.input : {};
    const persisted = await this.db.query.agentSession.findFirst({
      where: eq(agentSession.runId, runId),
      orderBy: (row, { desc }) => desc(row.startedAt),
    });
    const session = persisted
      ? this.restoreSession(run, input, persisted)
      : await this.createSession(run, input);
    const provider = await this.resolveProvider(organizationId);
    const repository = new AgentSessionRepository(this.db);
    const store = new AgentRuntimeStoreAdapter(repository, session.organizationId);
    const sandbox = new DockerAgentSandbox();
    const localRunner = new LocalWorkspaceCommandRunner();
    const workspaceRunner = new SandboxWorkspaceCommandRunner(sandbox, localRunner);
    const workspaceExecutor = new WorkspaceToolExecutor({
      commandRunner: workspaceRunner,
      getWorkspace: (current) => current.workspace,
    });
    const registry = new AgentToolRegistry([...this.systemTools.registrations(), ...this.githubTools.registrations()]);

    for (const name of [
      "read_file","write_file","edit_file","apply_patch","list_directory","search_files",
      "execute_command","git_status","git_diff","git_create_branch","git_checkout","git_commit","git_push",
    ] as const) {
      registry.register({
        name,
        handler: async (current, call) => {
          const result = await workspaceExecutor.execute(current, call);
          if (!result.ok) throw new Error(result.error ?? "Workspace tool failed");
          return result.output;
        },
      });
    }

    const runtime = new InMemoryAgentRuntime({
      createModel: () => this.createModel(provider, session),
      createExecutor: () => registry,
      createTools: () => getAgentToolsForContext(session.context.type),
    }, store);

    const sink = (event: AgentEvent) => this.events.publish(event);
    if (persisted) await runtime.recoverSession(session, sink);
    else await runtime.createSession(session, sink);
    this.runtimes.set(runId, runtime);
    this.workspaceRunners.set(runId, workspaceRunner);
    return runtime;
  }

  private restoreSession(
    run: typeof agentRun.$inferSelect,
    input: Record<string, unknown>,
    persisted: typeof agentSession.$inferSelect,
  ): AgentSession {
    const workspace = isRecord(input.workspace) && isWorkspace(input.workspace) ? input.workspace : undefined;
    return {
      id: persisted.id,
      runId: run.id,
      agentId: run.agentId,
      organizationId: run.organizationId,
      memberId: run.memberId,
      projectId: persisted.projectId ?? undefined,
      taskId: persisted.taskId ?? undefined,
      context: {
        type: isContextType(persisted.contextType) ? persisted.contextType : inferContextType(input),
        id: persisted.contextId ?? undefined,
        metadata: isRecord(persisted.metadata) ? persisted.metadata : input,
      },
      workspace,
    };
  }

  // fallow-ignore-next-line complexity -- session creation normalizes persisted runtime context and workspace state.
  private async createSession(run: typeof agentRun.$inferSelect, input: Record<string, unknown>): Promise<AgentSession> {
    const contextType = isContextType(input.contextType) ? input.contextType : inferContextType(input);
    const contextId = typeof input.contextId === "string" ? input.contextId : undefined;
    const projectId = typeof input.projectId === "string" ? input.projectId : undefined;
    const taskId = typeof input.taskId === "string" ? input.taskId : undefined;
    const workspace = isRecord(input.workspace) && isWorkspace(input.workspace) ? input.workspace : undefined;

    const session: AgentSession = {
      id: cryptoRandomUuid(),
      runId: run.id,
      agentId: run.agentId,
      organizationId: run.organizationId,
      memberId: run.memberId,
      projectId,
      taskId,
      context: { type: contextType, id: contextId, metadata: input },
      workspace,
    };

    const repository = new AgentSessionRepository(this.db);
    await repository.createSession({
      id: session.id,
      runId: session.runId,
      agentId: session.agentId,
      organizationId: session.organizationId,
      memberId: session.memberId,
      projectId,
      taskId,
      contextType,
      contextId,
      workspaceRoot: workspace?.root,
      workingBranch: workspace?.workingBranch,
      metadata: input,
    });
    return session;
  }

  private createModel(
    provider: { model: string; apiKey: string; baseUrl: string },
    session: AgentSession,
  ): AgentModel {
    return new OpenAIChatModel({
      apiKey: provider.apiKey,
      model: provider.model,
      baseUrl: provider.baseUrl,
      systemPrompt:
        "You are a Teamlyf organization agent. Work only within the current organization and context. " +
        "Use available tools for actions, never claim an action you did not perform, and ask for missing information.",
    });
  }

  // fallow-ignore-next-line complexity -- provider resolution validates organization credentials and provider constraints.
  private async resolveProvider(organizationId: string) {
    const config = await this.db.query.aiProviderConfig.findFirst({
      where: and(eq(aiProviderConfig.organizationId, organizationId), eq(aiProviderConfig.isActive, true)),
      orderBy: (row, { desc }) => desc(row.createdAt),
    });
    if (!config) throw new BadRequestException("No active AI provider is configured for this organization");
    if (config.provider !== "openai") throw new BadRequestException("The agent runtime currently supports the OpenAI provider");
    const apiKey = config.source === "byok"
      ? this.decryptApiKey(config.encryptedApiKey)
      : this.env.AGENT_MANAGED_API_KEY;
    if (!apiKey) throw new BadRequestException("AI provider credentials are not configured");
    return { model: config.model, apiKey, baseUrl: this.env.AGENT_OPENAI_BASE_URL };
  }

  private decryptApiKey(value: string | null) {
    if (!value) return null;
    if (!this.env.AGENT_ENCRYPTION_SECRET) throw new BadRequestException("Agent encryption is not configured");
    const [iv, tag, ciphertext] = value.split(":").map((part) => Buffer.from(part, "base64url"));
    const decipher = createDecipheriv("aes-256-gcm", createHash("sha256").update(this.env.AGENT_ENCRYPTION_SECRET).digest(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  }

  private async requireRun(organizationId: string, runId: string, memberId: string) {
    const run = await this.db.query.agentRun.findFirst({
      where: and(eq(agentRun.id, runId), eq(agentRun.organizationId, organizationId), eq(agentRun.memberId, memberId)),
    });
    if (!run) throw new NotFoundException("Agent run not found");
    return run;
  }
}

function cryptoRandomUuid(): string {
  return randomUUID();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isWorkspace(value: unknown): value is NonNullable<AgentSession["workspace"]> {
  return agentWorkspaceSchema.safeParse(value).success;
}

function isContextType(value: unknown): value is AgentSession["context"]["type"] {
  return agentContextTypeSchema.safeParse(value).success;
}

function inferContextType(input: Record<string, unknown>): AgentSession["context"]["type"] {
  if (typeof input.taskId === "string") return "task";
  if (typeof input.projectId === "string") return "project";
  if (typeof input.contextType === "string" && isContextType(input.contextType)) return input.contextType;
  return "organization";
}

class AgentRuntimeStoreAdapter implements AgentRuntimeStore {
  constructor(
    private readonly repository: AgentSessionRepository,
    private readonly organizationId: string,
  ) {}

  async createSession(): Promise<void> {}

  async updateSession(
    runId: string,
    update: { status?: "active" | "completed" | "failed" | "interrupted"; endedAt?: Date },
  ): Promise<void> {
    await this.repository.updateSession(runId, update);
  }

  async appendEvent(event: AgentEvent): Promise<void> {
    await this.repository.appendEvent({
      id: event.id,
      organizationId: this.organizationId,
      sessionId: event.sessionId,
      sequence: event.sequence,
      type: event.type,
      payload: event.payload,
      createdAt: event.createdAt,
    });
  }

  async createCheckpoint(checkpoint: AgentCheckpoint): Promise<void> {
    await this.repository.createCheckpoint(checkpoint);
  }

  async loadLatestCheckpoint(sessionId: string) {
    return this.repository.loadLatestCheckpoint(sessionId);
  }

  async loadAllowedTools(session: AgentSession): Promise<AgentToolName[]> {
    return this.repository.loadAllowedTools(session.organizationId, session.memberId, session.agentId) as Promise<AgentToolName[]>;
  }

  async persistAllowedTool(session: AgentSession, tool: AgentToolName): Promise<void> {
    await this.repository.allowTool(session.organizationId, session.memberId, session.agentId, tool);
  }
}

class SandboxWorkspaceCommandRunner implements import("@teamlyf/agents").WorkspaceCommandRunner {
  private readonly started = new Map<string, import("@teamlyf/agents").WorkspaceHandle>();

  constructor(
    private readonly sandbox: DockerAgentSandbox,
    private readonly localRunner: LocalWorkspaceCommandRunner,
  ) {}

  async stop(): Promise<void> {
    for (const workspace of this.started.values()) {
      await this.sandbox.stop(workspace).catch(() => undefined);
    }
    this.started.clear();
  }

  async run(
    workspace: import("@teamlyf/agents").WorkspaceHandle,
    command: string,
    args: readonly string[] = [],
    options: { timeoutMs?: number; maxOutputBytes?: number } = {},
  ) {
    const key = workspace.root;
    if (command === "git" && args[0] === "push") {
      return this.localRunner.run(workspace, command, args, options);
    }
    if (!this.started.has(key)) {
      await this.sandbox.start(workspace);
      this.started.set(key, workspace);
    }
    return this.sandbox.run(workspace, command, args, options);
  }
}
