import type { AgentToolName } from "./contracts";

export type AgentToolDefinition = {
  name: AgentToolName;
  description: string;
  parameters: Record<string, unknown>;
  requiresPermission: boolean;
};

const stringParameter = { type: "string" };

export const agentToolDefinitions: readonly AgentToolDefinition[] = [
  { name: "read_file", description: "Read a text file inside the project workspace.", parameters: { type: "object", properties: { path: stringParameter }, required: ["path"], additionalProperties: false }, requiresPermission: false },
  { name: "write_file", description: "Create or replace a text file inside the project workspace.", parameters: { type: "object", properties: { path: stringParameter, content: stringParameter }, required: ["path", "content"], additionalProperties: false }, requiresPermission: true },
  { name: "edit_file", description: "Apply a precise text replacement inside a project file.", parameters: { type: "object", properties: { path: stringParameter, oldText: stringParameter, newText: stringParameter }, required: ["path", "oldText", "newText"], additionalProperties: false }, requiresPermission: true },
  { name: "list_directory", description: "List files and directories inside the project workspace.", parameters: { type: "object", properties: { path: stringParameter }, required: ["path"], additionalProperties: false }, requiresPermission: false },
  { name: "search_files", description: "Search project files for text or code symbols.", parameters: { type: "object", properties: { query: stringParameter }, required: ["query"], additionalProperties: false }, requiresPermission: false },
  { name: "execute_command", description: "Run a command in the project workspace.", parameters: { type: "object", properties: { command: stringParameter }, required: ["command"], additionalProperties: false }, requiresPermission: true },
  { name: "git_status", description: "Inspect the current git working tree.", parameters: { type: "object", properties: {}, additionalProperties: false }, requiresPermission: false },
  { name: "git_diff", description: "Inspect the current git diff.", parameters: { type: "object", properties: {}, additionalProperties: false }, requiresPermission: false },
  { name: "git_create_branch", description: "Create the working branch for the agent run.", parameters: { type: "object", properties: { branch: stringParameter }, required: ["branch"], additionalProperties: false }, requiresPermission: true },
  { name: "git_commit", description: "Commit changes made by the agent.", parameters: { type: "object", properties: { message: stringParameter }, required: ["message"], additionalProperties: false }, requiresPermission: true },
  { name: "git_push", description: "Push the agent working branch to the configured remote.", parameters: { type: "object", properties: {}, additionalProperties: false }, requiresPermission: true },
  { name: "github_create_pull_request", description: "Create a pull request from the agent working branch.", parameters: { type: "object", properties: { title: stringParameter, body: stringParameter }, required: ["title", "body"], additionalProperties: false }, requiresPermission: true },
];
