import type { AgentToolDefinition } from "./contracts/model";

export type { AgentToolDefinition };

export function defineAgentTool(
  definition: AgentToolDefinition,
): AgentToolDefinition {
  return definition;
}
