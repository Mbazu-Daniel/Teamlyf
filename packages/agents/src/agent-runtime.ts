import { AgentLoop } from "./agent-loop";
import type { AgentEvent, AgentPermissionDecision, AgentSession } from "./contracts";
import type { AgentModel, AgentRuntime, AgentRuntimeEventSink, AgentRuntimeState, AgentToolExecutor } from "./runtime";
import type { AgentToolDefinition } from "./tool-definitions";
import type { AgentRuntimeStore } from "./runtime-store";

export type AgentRuntimeFactory = {
  createModel(session: AgentSession): AgentModel;
  createExecutor(session: AgentSession): AgentToolExecutor;
  createTools?(session: AgentSession): readonly AgentToolDefinition[];
};

type RuntimeEntry = {
  state: AgentRuntimeState;
  loop: AgentLoop;
};

export class InMemoryAgentRuntime implements AgentRuntime {
  private readonly entries = new Map<string, RuntimeEntry>();

  constructor(
    private readonly factory: AgentRuntimeFactory,
    private readonly store?: AgentRuntimeStore,
  ) {}

  async createSession(session: AgentSession, sink: AgentRuntimeEventSink): Promise<void> {
    if (this.entries.has(session.runId)) {
      throw new Error(`Agent session already exists for run ${session.runId}`);
    }

    const state: AgentRuntimeState = {
      session,
      messages: [],
      checkpoints: [],
      allowedTools: [],
      interrupted: false,
    };

    const emit = async (event: AgentEvent): Promise<void> => {
      await this.store?.appendEvent(event);
      await sink(event);
    };

    const loop = new AgentLoop({
      state,
      model: this.factory.createModel(session),
      executor: this.factory.createExecutor(session),
      tools: this.factory.createTools?.(session),
      emit,
      checkpoint: async (nextState) => {
        const checkpoint = nextState.checkpoints[nextState.checkpoints.length - 1];
        if (checkpoint) await this.store?.createCheckpoint(checkpoint);
      },
    });

    this.entries.set(session.runId, { state, loop });
    await this.store?.createSession(session);
  }

  async recoverSession(session: AgentSession, sink: AgentRuntimeEventSink): Promise<void> {
    if (this.entries.has(session.runId)) return;

    const checkpoint = await this.store?.loadLatestCheckpoint?.(session.id);
    const state: AgentRuntimeState = checkpoint
      ? {
          session,
          messages: Array.isArray(checkpoint.state.messages) ? checkpoint.state.messages as AgentRuntimeState["messages"] : [],
          checkpoints: [checkpoint],
          pendingPermission: isPendingPermission(checkpoint.state.pendingPermission) ? checkpoint.state.pendingPermission : undefined,
          allowedTools: isAllowedTools(checkpoint.state.allowedTools),
          interrupted: false,
        }
      : { session, messages: [], checkpoints: [], allowedTools: [], interrupted: false };

    const emit = async (event: AgentEvent): Promise<void> => {
      await this.store?.appendEvent(event);
      await sink(event);
    };

    const loop = new AgentLoop({
      state,
      model: this.factory.createModel(session),
      executor: this.factory.createExecutor(session),
      tools: this.factory.createTools?.(session),
      emit,
      initialSequence: checkpoint ? checkpoint.sequence + 1 : 0,
      checkpoint: async (nextState) => {
        const latest = nextState.checkpoints[nextState.checkpoints.length - 1];
        if (latest) await this.store?.createCheckpoint(latest);
      },
    });

    this.entries.set(session.runId, { state, loop });
  }

  async sendMessage(runId: string, message: string): Promise<void> {
    const entry = this.getEntry(runId);
    entry.state.interrupted = false;
    try {
      await entry.loop.run(message);
      await this.store?.updateSession(runId, {
        status: entry.state.interrupted ? "interrupted" : "completed",
        endedAt: entry.state.interrupted ? undefined : new Date(),
      });
    } catch (error) {
      await this.store?.updateSession(runId, { status: "failed", endedAt: new Date() });
      throw error;
    }
  }

  async interrupt(runId: string): Promise<void> {
    this.getEntry(runId).state.interrupted = true;
  }

  async resume(runId: string): Promise<void> {
    const entry = this.getEntry(runId);
    entry.state.interrupted = false;
  }

  async resolvePermission(
    runId: string,
    requestId: string,
    decision: AgentPermissionDecision,
  ): Promise<void> {
    this.getEntry(runId).loop.resolvePermission(requestId, decision);
  }

  private getEntry(runId: string): RuntimeEntry {
    const entry = this.entries.get(runId);
    if (!entry) throw new Error(`Agent runtime not found for run ${runId}`);
    return entry;
  }
}

function isAllowedTools(value: unknown): AgentRuntimeState["allowedTools"] {
  if (!Array.isArray(value)) return [];
  return value.filter((tool): tool is AgentRuntimeState["allowedTools"][number] => typeof tool === "string");
}

function isPendingPermission(value: unknown): AgentRuntimeState["pendingPermission"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.tool !== "string" ||
    typeof candidate.scope !== "string" ||
    typeof candidate.reason !== "string" ||
    typeof candidate.metadata !== "object" ||
    candidate.metadata === null ||
    Array.isArray(candidate.metadata)
  ) return undefined;
  return candidate as AgentRuntimeState["pendingPermission"];
}
