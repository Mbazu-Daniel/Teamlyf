import { AgentLoop } from "./agent-loop";
import type {
  AgentEvent,
  AgentModel,
  AgentPermissionDecision,
  AgentRuntimeState,
  AgentSession,
  AgentToolExecutor,
} from "./contracts";
import type { AgentRuntime, AgentRuntimeEventSink } from "./runtime";
import type { AgentRuntimeStore } from "./runtime-store";

export type AgentRuntimeFactory = {
  createModel(session: AgentSession): AgentModel;
  createExecutor(session: AgentSession): AgentToolExecutor;
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
      emit,
    });

    this.entries.set(session.runId, { state, loop });
    await this.store?.createSession(session);
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
