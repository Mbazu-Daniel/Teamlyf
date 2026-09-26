import type { AgentContextType } from "./contracts";
import type { AgentToolDefinition } from "./tool-definitions";
import { agentToolDefinitions } from "./tool-definitions";

const workspaceTools = new Set([
  "read_file","write_file","edit_file","list_directory","search_files","execute_command",
  "git_status","git_diff","git_create_branch","git_checkout","git_commit","git_push",
]);

export function getAgentToolsForContext(
  contextType: AgentContextType,
  definitions: readonly AgentToolDefinition[] = agentToolDefinitions,
): readonly AgentToolDefinition[] {
  if (contextType === "project" || contextType === "task") return definitions;

  return definitions.filter((definition) => !workspaceTools.has(definition.name));
}
