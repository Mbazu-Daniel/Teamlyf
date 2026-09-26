export type AgentToolDefinition = {
  name: string;
  description?: string;
  parameters: Record<string, unknown>;
};

export type AgentMessage =
  | { role: "user" | "assistant" | "system"; content: string }
  | { role: "assistant_tool_call"; toolCall: AgentToolCall }
  | { role: "tool"; toolCallId: string; content: string };

export type AgentToolCall = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

export type AgentModelStreamEvent =
  | { type: "text"; text: string }
  | { type: "tool_call"; toolCall: AgentToolCall };

export interface AgentModel {
  stream(
    messages: readonly AgentMessage[],
    tools: readonly AgentToolDefinition[],
  ): AsyncIterable<AgentModelStreamEvent>;
}
