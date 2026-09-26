import type {
  AgentEvent,
  AgentPermissionRequest,
  AgentSession,
  AgentToolCall,
  AgentToolResult,
} from "./contracts";

export type AgentRuntimeEventSink = (event: AgentEvent) => Promise<void> | void;

export interface AgentRuntime {
  createSession(session: AgentSession, sink: AgentRuntimeEventSink): Promise<void>;
  sendMessage(runId: string, message: string): Promise<void>;
  interrupt(runId: string): Promise<void>;
  resolvePermission(
    runId: string,
    request: AgentPermissionRequest,
    decision: "once" | "always" | "reject",
  ): Promise<void>;
}

export interface AgentToolExecutor {
  execute(session: AgentSession, call: AgentToolCall): Promise<AgentToolResult>;
}
