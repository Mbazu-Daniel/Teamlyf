import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  type OnModuleInit,
  type OnModuleDestroy,
} from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validateOrReject } from "class-validator";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { Database } from "@teamlyf/db";
import {
  agent,
  agentRun,
  aiProviderConfig,
  aiUsage,
  billingSchema,
  member,
  project,
  task,
  taskComment,
} from "@teamlyf/db";

const { subscription } = billingSchema;
import { and, count, eq } from "drizzle-orm";
import { API_ENV } from "../../common/config/env.module";
import type { ApiEnv } from "../../common/config/env";
import { DATABASE } from "../../common/db/db.provider";
import type { SessionMember } from "../../common/types";
import type {
  CreateAgentDto,
  CreateAgentRunDto,
  RecordUsageDto,
  UpdateAgentDto,
  UpsertProviderConfigDto,
} from "./agent.dto";
import { planEntitlements, type BillingPlan } from "../billing/plan-entitlements";
import { OrganizationPermissionService } from "../rbac/organization-permission.service";
import { TaskService } from "../project/task/task.service";
import { UpdateTaskDto } from "../project/task/dto";

@Injectable()
export class AgentService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AgentService.name);
  private readonly activeRuns = new Map<string, AbortController>();
  private timer?: ReturnType<typeof setInterval>;
  private polling = false;

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(API_ENV) private readonly env: ApiEnv,
    private readonly permissions: OrganizationPermissionService,
    private readonly tasks: TaskService,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      void this.pollRuns();
    }, 500);
    this.timer.unref();
  }

  onModuleDestroy() {
    clearInterval(this.timer);
    for (const controller of this.activeRuns.values()) controller.abort();
  }

  private async pollRuns() {
    if (this.polling || this.activeRuns.size >= 3) return;
    this.polling = true;
    try {
      await this.processQueuedRuns();
    } catch {
      this.logger.error("Unable to poll the agent queue; will retry");
    } finally {
      this.polling = false;
    }
  }

  async getAgents(organizationId: string) {
    return this.db.query.agent.findMany({
      where: eq(agent.organizationId, organizationId),
      orderBy: (table, { asc }) => asc(table.createdAt),
    });
  }

  async create(organizationId: string, dto: CreateAgentDto) {
    await this.assertAgentCapacity(organizationId);
    const [created] = await this.db
      .insert(agent)
      .values({
        organizationId,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
      })
      .returning();
    return created;
  }

  async update(organizationId: string, agentId: string, dto: UpdateAgentDto) {
    await this.requireAgent(organizationId, agentId);
    const [updated] = await this.db
      .update(agent)
      .set(this.buildUpdateValues(dto))
      .where(and(eq(agent.organizationId, organizationId), eq(agent.id, agentId)))
      .returning();
    return updated;
  }

  async createRun(
    organizationId: string,
    member: SessionMember,
    agentId: string,
    dto: CreateAgentRunDto,
  ) {
    const target = await this.requireAgent(organizationId, agentId);
    if (!target.enabled) throw new ForbiddenException("Agent is disabled");

    const [run] = await this.db
      .insert(agentRun)
      .values({
        organizationId,
        agentId,
        memberId: member.id,
        input: dto.input === undefined ? null : dto.input,
      })
      .returning();

    return run;
  }

  private async processQueuedRuns() {
    const queued = await this.db.query.agentRun.findMany({
      where: eq(agentRun.status, "queued"),
      orderBy: (row, { asc }) => asc(row.createdAt),
      limit: 3 - this.activeRuns.size,
    });

    for (const candidate of queued) {
      const [claimed] = await this.db
        .update(agentRun)
        .set({
          status: "running",
          startedAt: new Date(),
          attemptCount: candidate.attemptCount + 1,
          updatedAt: new Date(),
        })
        .where(and(eq(agentRun.id, candidate.id), eq(agentRun.status, "queued")))
        .returning();
      if (claimed) {
        const controller = new AbortController();
        this.activeRuns.set(claimed.id, controller);
        void this.executeRun(claimed.id, controller.signal)
          .catch(() => this.logger.error("Unable to persist the agent run result"))
          .finally(() => this.activeRuns.delete(claimed.id));
      }
    }
  }

  // fallow-ignore-next-line complexity -- agent execution coordinates validation, provider resolution and terminal run state transitions
  private async executeRun(runId: string, signal: AbortSignal) {
    try {
      const run = await this.db.query.agentRun.findFirst({ where: eq(agentRun.id, runId) });
      if (!run || run.status !== "running") return;

      const target = await this.db.query.agent.findFirst({
        where: and(eq(agent.id, run.agentId), eq(agent.organizationId, run.organizationId)),
      });
      if (!target || !target.enabled) throw new Error("Agent is disabled or unavailable");

      const input = isRecord(run.input) ? run.input : {};
      const taskId = typeof input.taskId === "string" ? input.taskId : undefined;
      const projectId = typeof input.projectId === "string" ? input.projectId : undefined;
      if (!taskId || !projectId) throw new Error("Agent runs require taskId and projectId");

      const taskRecord = await this.db.query.task.findFirst({
        where: and(eq(task.id, taskId), eq(task.projectId, projectId)),
        with: { status: true },
      });
      const projectRecord = await this.db.query.project.findFirst({
        where: and(eq(project.id, projectId), eq(project.organizationId, run.organizationId)),
      });
      if (!taskRecord || !projectRecord) throw new Error("Assigned task is no longer available");

      const provider = await this.resolveProvider(run.organizationId);
      await this.requireRunPermission(runId, "read", taskId);
      const result = await this.runModel(
        provider,
        target,
        taskRecord,
        projectRecord,
        input,
        run.memberId,
        runId,
        signal,
      );
      await this.db
        .update(agentRun)
        .set({
          status: "completed",
          output: result,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(eq(agentRun.id, runId), eq(agentRun.status, "running")));
    } catch (error) {
      await this.db
        .update(agentRun)
        .set({
          status: "failed",
          errorCode: "execution_failed",
          errorMessage: error instanceof Error ? error.message : "Agent execution failed",
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(eq(agentRun.id, runId), eq(agentRun.status, "running")));
    }
  }

  private async requireRunPermission(runId: string, action: string, taskId: string) {
    const run = await this.db.query.agentRun.findFirst({ where: eq(agentRun.id, runId) });
    if (!run || run.status !== "running") throw new Error("Agent run is no longer active");
    const target = await this.requireAgent(run.organizationId, run.agentId);
    const requester = await this.db.query.member.findFirst({
      where: and(eq(member.id, run.memberId), eq(member.organizationId, run.organizationId)),
    });
    if (!target.enabled || !requester)
      throw new Error("Agent or requesting member is no longer available");
    if (
      !(await this.permissions.checkAgentPermission(
        run.organizationId,
        run.agentId,
        "pm",
        action,
        taskId,
      ))
    ) {
      throw new Error(`Agent requires a pm:${action} tool grant for this task`);
    }
    return run;
  }

  // fallow-ignore-next-line complexity -- provider resolution intentionally validates source, provider and credential requirements together
  private async resolveProvider(organizationId: string) {
    const configs = await this.db.query.aiProviderConfig.findMany({
      where: and(
        eq(aiProviderConfig.organizationId, organizationId),
        eq(aiProviderConfig.isActive, true),
      ),
      orderBy: (row, { desc }) => desc(row.createdAt),
    });
    const config = configs[0];
    if (!config) throw new Error("No active AI provider is configured for this organization");
    if (config.provider !== "openai")
      throw new Error("The agent runtime currently supports the OpenAI provider");
    const apiKey =
      config.source === "byok"
        ? this.decryptApiKey(config.encryptedApiKey)
        : this.env.AGENT_MANAGED_API_KEY;
    if (!apiKey) throw new Error("AI provider credentials are not configured");
    return { model: config.model, apiKey, baseUrl: this.env.AGENT_OPENAI_BASE_URL };
  }

  // fallow-ignore-next-line complexity -- model execution owns the bounded tool-calling loop and provider response handling
  private async runModel(
    provider: { model: string; apiKey: string; baseUrl: string },
    target: { name: string; description: string | null },
    taskRecord: {
      id: string;
      name: string;
      description: string | null;
      priority: string;
      targetDate: Date | null;
      statusId: string;
      status: { name: string };
    },
    projectRecord: { id: string; name: string; description: string | null },
    input: Record<string, unknown>,
    memberId: string,
    runId: string,
    signal: AbortSignal,
  ) {
    const tools = [
      {
        type: "function",
        function: {
          name: "update_task",
          description: "Update the assigned task. Only change fields needed to complete the work.",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              priority: { type: "string", enum: ["urgent", "high", "medium", "low", "none"] },
              statusId: { type: "string" },
              targetDate: { type: "string" },
            },
            additionalProperties: false,
          },
        },
      },
      {
        type: "function",
        function: {
          name: "add_comment",
          description: "Add a progress or completion comment to the assigned task.",
          parameters: {
            type: "object",
            properties: { body: { type: "string" } },
            required: ["body"],
            additionalProperties: false,
          },
        },
      },
    ];

    const messages: Array<Record<string, unknown>> = [
      {
        role: "system",
        content:
          "You are an organization AI agent inside Teamlyf. Work only on the assigned task. Do not invent facts or claim actions you did not perform. Use tools for task changes. Finish with a concise summary and blockers.\n\nAgent role: " +
          (target.description ?? target.name),
      },
      {
        role: "user",
        content: JSON.stringify({
          project: projectRecord,
          task: taskRecord,
          instruction: input.instruction ?? "Work on this task.",
          context: input,
        }),
      },
    ];

    for (let step = 0; step < 8; step += 1) {
      signal.throwIfAborted();
      await this.requireRunPermission(runId, "read", taskRecord.id);
      const response = await fetch(provider.baseUrl + "/chat/completions", {
        signal: AbortSignal.any([signal, AbortSignal.timeout(30_000)]),
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer " + provider.apiKey },
        body: JSON.stringify({
          model: provider.model,
          messages,
          tools,
          tool_choice: "auto",
          temperature: 0.2,
        }),
      });
      if (!response.ok) throw new Error("AI provider returned HTTP " + response.status);
      const payload = (await response.json()) as OpenAIResponse;
      const message = payload.choices?.[0]?.message;
      if (!message) throw new Error("AI provider returned no message");

      messages.push(message);
      if (!message.tool_calls?.length) return { summary: message.content ?? "", steps: step + 1 };

      for (const call of message.tool_calls) {
        signal.throwIfAborted();
        const args = parseJson(call.function.arguments);
        let output: unknown;
        if (call.function.name === "update_task") {
          const run = await this.requireRunPermission(runId, "update", taskRecord.id);
          output = await this.updateTaskFromAgent(
            run.organizationId,
            projectRecord.id,
            taskRecord.id,
            memberId,
            args,
          );
        } else if (call.function.name === "add_comment") {
          await this.requireRunPermission(runId, "create", taskRecord.id);
          output = await this.addCommentFromAgent(taskRecord.id, memberId, args);
        } else {
          output = { error: "Unknown tool" };
        }
        messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(output) });
      }
    }
    throw new Error("Agent reached the maximum execution steps");
  }

  private async updateTaskFromAgent(
    organizationId: string,
    projectId: string,
    taskId: string,
    memberId: string,
    args: Record<string, unknown>,
  ) {
    const allowed = ["name", "description", "priority", "statusId", "targetDate"] as const;
    const values: Record<string, unknown> = {};
    for (const key of allowed) if (typeof args[key] === "string") values[key] = args[key];
    const dto = plainToInstance(UpdateTaskDto, values);
    try {
      await validateOrReject(dto);
    } catch {
      throw new Error("Agent returned invalid task fields");
    }
    await this.tasks.updateTask(organizationId, projectId, taskId, dto, memberId);
    return { updated: true, fields: Object.keys(values) };
  }

  private async addCommentFromAgent(
    taskId: string,
    memberId: string,
    args: Record<string, unknown>,
  ) {
    if (typeof args.body !== "string" || !args.body.trim())
      throw new Error("Comment body is required");
    const [comment] = await this.db
      .insert(taskComment)
      .values({ taskId, actorId: memberId, body: args.body.trim() })
      .returning({ id: taskComment.id });
    return { created: true, commentId: comment.id };
  }

  private decryptApiKey(value: string | null) {
    if (!value) return null;
    const secret = this.env.AGENT_ENCRYPTION_SECRET;
    if (!secret) throw new Error("Agent encryption is not configured");
    const [iv, tag, ciphertext] = value.split(":").map((part) => Buffer.from(part, "base64url"));
    const decipher = createDecipheriv(
      "aes-256-gcm",
      createHash("sha256").update(secret).digest(),
      iv,
    );
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  }

  async getAgentRuns(organizationId: string, agentId: string) {
    await this.requireAgent(organizationId, agentId);
    return this.db.query.agentRun.findMany({
      where: and(eq(agentRun.organizationId, organizationId), eq(agentRun.agentId, agentId)),
      orderBy: (table, { desc }) => desc(table.createdAt),
      limit: 100,
    });
  }

  async getAgentUsage(organizationId: string, memberId: string) {
    return this.db.query.aiUsage.findMany({
      where: and(eq(aiUsage.organizationId, organizationId), eq(aiUsage.memberId, memberId)),
      orderBy: (table, { desc }) => desc(table.createdAt),
      limit: 100,
    });
  }

  async upsertProviderConfig(organizationId: string, dto: UpsertProviderConfigDto) {
    this.validateProviderConfig(dto);
    const encryptedApiKey = this.encryptOptionalApiKey(dto.apiKey);
    const [config] = await this.saveProviderConfig(organizationId, dto, encryptedApiKey);

    return {
      id: config.id,
      organizationId: config.organizationId,
      provider: config.provider,
      model: config.model,
      source: config.source,
      isActive: config.isActive,
    };
  }

  async getProviderConfigs(organizationId: string) {
    return this.db.query.aiProviderConfig.findMany({
      where: eq(aiProviderConfig.organizationId, organizationId),
      columns: {
        id: true,
        organizationId: true,
        provider: true,
        model: true,
        source: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: (table, { desc }) => desc(table.createdAt),
    });
  }

  async recordUsage(organizationId: string, memberId: string, dto: RecordUsageDto) {
    await this.requireAgent(organizationId, dto.agentId);
    const totalTokens = dto.inputTokens + dto.outputTokens;
    const allowanceConsumed = dto.source === "managed" ? totalTokens : 0;

    const [usage] = await this.db
      .insert(aiUsage)
      .values({
        organizationId,
        memberId,
        agentId: dto.agentId,
        provider: dto.provider.trim(),
        model: dto.model.trim(),
        source: dto.source,
        inputTokens: dto.inputTokens,
        outputTokens: dto.outputTokens,
        totalTokens,
        estimatedCostUsd: dto.estimatedCostUsd ?? null,
        allowanceConsumed,
      })
      .returning();

    return usage;
  }

  async deleteAgent(organizationId: string, agentId: string) {
    await this.requireAgent(organizationId, agentId);

    return this.db.transaction(async (tx) => {
      await tx
        .update(aiUsage)
        .set({ agentId: null })
        .where(and(eq(aiUsage.organizationId, organizationId), eq(aiUsage.agentId, agentId)));
      await tx
        .delete(agentRun)
        .where(and(eq(agentRun.organizationId, organizationId), eq(agentRun.agentId, agentId)));
      const [deleted] = await tx
        .delete(agent)
        .where(and(eq(agent.organizationId, organizationId), eq(agent.id, agentId)))
        .returning();
      return deleted;
    });
  }

  async cancelRun(organizationId: string, agentId: string, runId: string) {
    await this.requireAgent(organizationId, agentId);
    const run = await this.db.query.agentRun.findFirst({
      where: and(
        eq(agentRun.id, runId),
        eq(agentRun.organizationId, organizationId),
        eq(agentRun.agentId, agentId),
      ),
    });
    if (!run) throw new NotFoundException("Agent run not found");
    if (run.status !== "queued" && run.status !== "running") {
      throw new BadRequestException("Only queued or running runs can be cancelled");
    }
    const [updated] = await this.db
      .update(agentRun)
      .set({ status: "cancelled", completedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(agentRun.id, runId), eq(agentRun.status, run.status)))
      .returning();
    if (!updated) throw new BadRequestException("Agent run has already finished");
    this.activeRuns.get(runId)?.abort();
    return updated;
  }

  async deleteProviderConfig(organizationId: string, configId: string) {
    const [deleted] = await this.db
      .delete(aiProviderConfig)
      .where(
        and(eq(aiProviderConfig.organizationId, organizationId), eq(aiProviderConfig.id, configId)),
      )
      .returning({
        id: aiProviderConfig.id,
        organizationId: aiProviderConfig.organizationId,
        provider: aiProviderConfig.provider,
        model: aiProviderConfig.model,
        source: aiProviderConfig.source,
        isActive: aiProviderConfig.isActive,
      });
    if (!deleted) throw new NotFoundException("Provider configuration not found");
    return deleted;
  }

  private buildUpdateValues(dto: UpdateAgentDto) {
    const values: Record<string, unknown> = { updatedAt: new Date() };
    const fields = [
      ["name", dto.name?.trim()],
      ["description", dto.description?.trim() || null],
      ["enabled", dto.enabled],
    ] as const;

    for (const [key, value] of fields) {
      if (value !== undefined) values[key] = value;
    }
    return values;
  }

  private validateProviderConfig(dto: UpsertProviderConfigDto) {
    if (dto.source === "byok") {
      this.requireApiKey(dto.apiKey);
      return;
    }
    if (dto.source === "managed" && dto.apiKey) {
      throw new BadRequestException("Managed providers do not accept organization API keys");
    }
  }

  private requireApiKey(apiKey?: string) {
    if (!apiKey) {
      throw new BadRequestException("BYOK provider configuration requires an API key");
    }
  }

  private encryptOptionalApiKey(apiKey?: string): string | null {
    return apiKey ? this.encrypt(apiKey) : null;
  }

  private async saveProviderConfig(
    organizationId: string,
    dto: UpsertProviderConfigDto,
    encryptedApiKey: string | null,
  ) {
    const keyVersion = encryptedApiKey ? "v1" : null;
    return this.db
      .insert(aiProviderConfig)
      .values({
        organizationId,
        provider: dto.provider.trim(),
        model: dto.model.trim(),
        source: dto.source,
        encryptedApiKey,
        keyVersion,
      })
      .onConflictDoUpdate({
        target: [
          aiProviderConfig.organizationId,
          aiProviderConfig.source,
          aiProviderConfig.provider,
          aiProviderConfig.model,
        ],
        set: { encryptedApiKey, keyVersion, isActive: true, updatedAt: new Date() },
      })
      .returning();
  }

  private async requireAgent(organizationId: string, agentId: string) {
    const found = await this.db.query.agent.findFirst({
      where: and(eq(agent.organizationId, organizationId), eq(agent.id, agentId)),
    });
    if (!found) throw new NotFoundException("Agent not found");
    return found;
  }

  private async assertAgentCapacity(organizationId: string) {
    const [currentSubscription, result] = await Promise.all([
      this.db.query.subscription.findFirst({
        where: eq(subscription.organizationId, organizationId),
      }),
      this.db
        .select({ total: count() })
        .from(agent)
        .where(eq(agent.organizationId, organizationId)),
    ]);

    const limit = this.resolveAgentLimit(currentSubscription);
    if (Number(result[0]?.total ?? 0) >= limit) {
      throw new ForbiddenException("Agent limit reached for the organization plan");
    }
  }

  private resolveAgentLimit(subscription?: { plan: string }): number {
    const plan = subscription?.plan as BillingPlan | undefined;
    return planEntitlements[plan ?? "starter"].agentLimit;
  }

  private encrypt(value: string): string {
    const secret = this.env.AGENT_ENCRYPTION_SECRET;
    if (!secret) throw new BadRequestException("Agent encryption is not configured");
    const key = createHash("sha256").update(secret).digest();
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [
      iv.toString("base64url"),
      tag.toString("base64url"),
      ciphertext.toString("base64url"),
    ].join(":");
  }
}

type OpenAIResponse = {
  choices?: Array<{
    message?: {
      role: "assistant";
      content?: string;
      tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }>;
    };
  }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJson(value: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(value);
  if (!isRecord(parsed)) throw new Error("Agent tool arguments must be an object");
  return parsed;
}
