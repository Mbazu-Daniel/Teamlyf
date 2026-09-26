import type {
  AgentMessage,
  AgentPermissionDecision,
  AgentPermissionRequest,
  AgentSession,
  AgentToolCall,
  AgentToolName,
  AgentToolResult,
} from "./contracts";

export type AgentRuntimeEventSink = (
  event: import("./contracts").AgentEvent,
) => Promise<void> | void;

export type AgentRuntimeState = {
  session: AgentSession;
  messages: AgentMessage[];
  checkpoints: import("./contracts").AgentCheckpoint[];
  pendingPermission?: AgentPermissionRequest;
  allowedTools: AgentToolName[];
  interrupted: boolean;
};

export interface AgentRuntime {
  createSession(session: AgentSession, sink: AgentRuntimeEventSink): Promise<void>;
  sendMessage(runId: string, message: string): Promise<void>;
  interrupt(runId: string): Promise<void>;
  resume(runId: string): Promise<void>;
  resolvePermission(
    runId: string,
    requestId: string,
    decision: AgentPermissionDecision,
  ): Promise<void>;
  recoverSession(session: AgentSession, sink: AgentRuntimeEventSink): Promise<void>;
}

export interface AgentModel {
  stream(
    messages: readonly AgentMessage[],
    tools: readonly import("./tool-definitions").AgentToolDefinition[],
  ): AsyncIterable<{
    type: "text" | "tool_call";
    text?: string;
    toolCall?: AgentToolCall;
  }>;
}

export interface AgentToolExecutor {
  execute(session: AgentSession, call: AgentToolCall): Promise<AgentToolResult>;
}
