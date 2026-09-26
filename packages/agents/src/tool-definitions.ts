import type { AgentToolName } from "./contracts";
export type AgentToolDefinition = {
  name: AgentToolName; description: string; parameters: Record<string, unknown>;
  requiresPermission: boolean;
};
const s={type:"string"};
export const agentToolDefinitions: readonly AgentToolDefinition[] = [
 {name:"read_file",description:"Read a text file inside the project workspace.",parameters:{type:"object",properties:{path:s},required:["path"]},requiresPermission:false},
 {name:"write_file",description:"Create or replace a text file inside the project workspace.",parameters:{type:"object",properties:{path:s,content:s},required:["path","content"]},requiresPermission:true},
 {name:"edit_file",description:"Apply a precise text replacement inside a project file.",parameters:{type:"object",properties:{path:s,oldText:s,newText:s},required:["path","oldText","newText"]},requiresPermission:true},
 {name:"apply_patch",description:"Apply a patch to workspace files.",parameters:{type:"object",properties:{patch:s},required:["patch"]},requiresPermission:true},
 {name:"list_directory",description:"List workspace files and directories.",parameters:{type:"object",properties:{path:s},required:["path"]},requiresPermission:false},
 {name:"search_files",description:"Search workspace files for code or text.",parameters:{type:"object",properties:{query:s},required:["query"]},requiresPermission:false},
 {name:"execute_command",description:"Run a command in the project workspace.",parameters:{type:"object",properties:{command:s,args:{type:"array",items:s}},required:["command"]},requiresPermission:true},
 {name:"git_status",description:"Inspect git status.",parameters:{type:"object",properties:{}},requiresPermission:false},
 {name:"git_diff",description:"Inspect git diff.",parameters:{type:"object",properties:{}},requiresPermission:false},
 {name:"git_create_branch",description:"Create the agent working branch.",parameters:{type:"object",properties:{branch:s},required:["branch"]},requiresPermission:true},
 {name:"git_checkout",description:"Switch workspace branch.",parameters:{type:"object",properties:{branch:s},required:["branch"]},requiresPermission:true},
 {name:"git_commit",description:"Commit workspace changes.",parameters:{type:"object",properties:{message:s},required:["message"]},requiresPermission:true},
 {name:"git_push",description:"Push the agent branch.",parameters:{type:"object",properties:{}},requiresPermission:true},
 {name:"github_create_pull_request",description:"Open a pull request for the completed work.",parameters:{type:"object",properties:{title:s,body:s},required:["title","body"]},requiresPermission:true},
 {name:"github_get_pull_request",description:"Inspect an existing pull request.",parameters:{type:"object",properties:{number:s},required:["number"]},requiresPermission:false},
 {name:"ask_user",description:"Ask the user for information needed to continue.",parameters:{type:"object",properties:{question:s},required:["question"]},requiresPermission:false},
 {name:"web_search",description:"Search the web for external documentation or information.",parameters:{type:"object",properties:{query:s},required:["query"]},requiresPermission:false},
];
