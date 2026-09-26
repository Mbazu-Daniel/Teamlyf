import type { AgentContextType } from "./contracts";
import type { AgentToolDefinition } from "./tool-definitions";
import { agentToolDefinitions } from "./tool-definitions";

type AgentCapability =
  | "organization"
  | "project"
  | "task"
  | "chat"
  | "document"
  | "note"
  | "hr"
  | "workspace"
  | "github"
  | "general";

const capabilityByTool: Partial<Record<AgentToolDefinition["name"], readonly AgentCapability[]>> = {
  read_file: ["workspace"],
  write_file: ["workspace"],
  edit_file: ["workspace"],
  apply_patch: ["workspace"],
  list_directory: ["workspace"],
  search_files: ["workspace"],
  execute_command: ["workspace"],
  git_status: ["workspace"],
  git_diff: ["workspace"],
  git_create_branch: ["workspace"],
  git_checkout: ["workspace"],
  git_commit: ["workspace"],
  git_push: ["workspace"],
  github_create_pull_request: ["github"],
  github_get_pull_request: ["github"],

  get_project: ["project", "task"],
  list_tasks: ["project", "task"],
  update_task: ["project", "task"],

  search_documents: ["document"],
  read_document: ["document"],
  create_document: ["document"],

  search_notes: ["note"],
  read_note: ["note"],
  update_note: ["note"],

  search_chat: ["chat"],
  send_chat_message: ["chat"],

  get_member_profile: ["hr"],
  list_leave_requests: ["hr"],

  ask_user: ["general"],
  web_search: ["general"],
};

const contextCapabilities: Record<AgentContextType, readonly AgentCapability[]> = {
  organization: ["organization", "project", "chat", "document", "note", "hr", "general"],
  project: ["organization", "project", "task", "chat", "document", "note", "hr", "workspace", "github", "general"],
  task: ["organization", "project", "task", "chat", "document", "note", "hr", "workspace", "github", "general"],
  chat: ["organization", "chat", "general"],
  document: ["organization", "document", "chat", "general"],
  note: ["organization", "note", "chat", "general"],
  hr: ["organization", "hr", "general"],
  call: ["organization", "chat", "general"],
  custom: ["organization", "general"],
};

export function getAgentCapabilitiesForContext(contextType: AgentContextType): readonly AgentCapability[] {
  return contextCapabilities[contextType];
}

export function getAgentToolsForContext(
  contextType: AgentContextType,
  definitions: readonly AgentToolDefinition[] = agentToolDefinitions,
): readonly AgentToolDefinition[] {
  const capabilities = new Set(getAgentCapabilitiesForContext(contextType));

  return definitions.filter((definition) => {
    const required = capabilityByTool[definition.name];

    // Unknown tools remain unavailable by default. This prevents a newly-added
    // tool from silently becoming callable in every context.
    if (!required) return false;

    return required.some((capability) => capabilities.has(capability));
  });
}
