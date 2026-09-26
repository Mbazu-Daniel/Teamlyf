export type { AgentToolDefinition } from "./contracts/model";

export function defineAgentTool(
  definition: import("./contracts/model").AgentToolDefinition,
): import("./contracts/model").AgentToolDefinition {
  return definition;
}
