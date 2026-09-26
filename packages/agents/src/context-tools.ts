import type { AgentContextType } from "./contracts";
import type { AgentToolDefinition } from "./tool-definitions";
import { agentToolDefinitions } from "./tool-definitions";

const workspaceTools = new Set([
  "read_file","write_file","edit_file","list_directory","search_files","execute_command",
  "git_status","git_diff","git_create_branch","git_checkout","git_commit","git_push",
]);

const contextCapabilities: Record<AgentContextType, readonly string[]> = {
  organization: ["organization","chat","docs","notes","hr"],
  project: ["organization","project","chat","docs","notes","hr","workspace"],
  task: ["organization","project","task","chat","docs","notes","hr","workspace"],
  chat: ["organization","chat"],
  document: ["organization","docs","chat"],
  note: ["organization","notes","chat"],
  hr: ["organization","hr"],
  call: ["organization","chat"],
  custom: ["organization"],
};

export function getAgentCapabilitiesForContext(contextType: AgentContextType): readonly string[] {
  return contextCapabilities[contextType];
}

export function getAgentToolsForContext(
  contextType: AgentContextType,
  definitions: readonly AgentToolDefinition[] = agentToolDefinitions,
): readonly AgentToolDefinition[] {
  const capabilities = new Set(getAgentCapabilitiesForContext(contextType));

  return definitions.filter((definition) => {
    if (workspaceTools.has(definition.name)) return capabilities.has("workspace");
    if (definition.name.startsWith("get_project") || definition.name === "list_tasks" || definition.name === "update_task") {
      return capabilities.has("project") || capabilities.has("task");
    }
    if (definition.name.includes("document")) return capabilities.has("docs");
    if (definition.name.includes("note")) return capabilities.has("notes");
    if (definition.name.includes("chat")) return capabilities.has("chat");
    if (definition.name.includes("leave") || definition.name.includes("member_profile")) return capabilities.has("hr");
    return true;
  });
}
