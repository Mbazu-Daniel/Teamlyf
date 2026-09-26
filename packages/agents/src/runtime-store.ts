import type { AgentEvent, AgentRuntimeState, AgentSession } from "./contracts";

export interface AgentRuntimeStore {
  createSession(session: AgentSession): Promise<void>;
  updateSession(
    sessionId: string,
    update: { status?: "active" | "completed" | "failed" | "interrupted"; endedAt?: Date },
  ): Promise<void>;
  appendEvent(event: AgentEvent): Promise<void>;
  loadSession?(runId: string): Promise<AgentRuntimeState | undefined>;
}
