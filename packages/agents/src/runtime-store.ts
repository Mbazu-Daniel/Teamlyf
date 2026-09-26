import type { AgentCheckpoint, AgentEvent, AgentRuntimeState, AgentSession } from "./contracts";

export interface AgentRuntimeStore {
  createSession(session: AgentSession): Promise<void>;
  updateSession(
    runId: string,
    update: { status?: "active" | "completed" | "failed" | "interrupted"; endedAt?: Date },
  ): Promise<void>;
  appendEvent(event: AgentEvent): Promise<void>;
  createCheckpoint(checkpoint: AgentCheckpoint): Promise<void>;
  loadLatestCheckpoint?(sessionId: string): Promise<AgentCheckpoint | undefined>;
  loadSession?(runId: string): Promise<AgentRuntimeState | undefined>;
}
