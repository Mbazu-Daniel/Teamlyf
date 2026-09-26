import type { AgentCheckpoint, AgentEvent, AgentSession, AgentToolName } from "./contracts";
import type { AgentRuntimeState } from "./runtime";

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
  loadAllowedTools?(session: AgentSession): Promise<AgentToolName[]>;
  persistAllowedTool?(session: AgentSession, tool: AgentToolName): Promise<void>;
}
