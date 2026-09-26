import type { AgentToolName } from "./contracts";

export type AgentToolDefinition = {
  name: AgentToolName;
  description: string;
  parameters: Record<string, unknown>;
  requiresPermission: boolean;
};

const s = { type: "string" };

export const agentToolDefinitions: readonly AgentToolDefinition[] = [
  { name:"read_file", description:"Read a text file inside the project workspace.", parameters:{type:"object",properties:{path:s},required:["path"]}, requiresPermission:false },
  { name:"write_file", description:"Create or replace a text file inside the project workspace.", parameters:{type:"object",properties:{path:s,content:s},required:["path","content"]}, requiresPermission:true },
  { name:"edit_file", description:"Apply a precise text replacement inside a project file.", parameters:{type:"object",properties:{path:s,oldText:s,newText:s},required:["path","oldText","newText"]}, requiresPermission:true },
  { name:"apply_patch", description:"Apply a patch to workspace files.", parameters:{type:"object",properties:{patch:s},required:["patch"]}, requiresPermission:true },
  { name:"list_directory", description:"List workspace files and directories.", parameters:{type:"object",properties:{path:s},required:["path"]}, requiresPermission:false },
  { name:"search_files", description:"Search workspace files for code or text.", parameters:{type:"object",properties:{query:s},required:["query"]}, requiresPermission:false },
  { name:"execute_command", description:"Run a command in the project workspace.", parameters:{type:"object",properties:{command:s,args:{type:"array",items:s}},required:["command"]}, requiresPermission:true },
  { name:"git_status", description:"Inspect git status.", parameters:{type:"object",properties:{}}, requiresPermission:false },
  { name:"git_diff", description:"Inspect git diff.", parameters:{type:"object",properties:{}}, requiresPermission:false },
  { name:"git_create_branch", description:"Create the agent working branch.", parameters:{type:"object",properties:{branch:s},required:["branch"]}, requiresPermission:true },
  { name:"git_checkout", description:"Switch workspace branch.", parameters:{type:"object",properties:{branch:s},required:["branch"]}, requiresPermission:true },
  { name:"git_commit", description:"Commit workspace changes.", parameters:{type:"object",properties:{message:s},required:["message"]}, requiresPermission:true },
  { name:"git_push", description:"Push the agent branch.", parameters:{type:"object",properties:{}}, requiresPermission:true },
  { name:"github_create_pull_request", description:"Open a pull request for the completed work.", parameters:{type:"object",properties:{title:s,body:s},required:["title","body"]}, requiresPermission:true },
  { name:"github_get_pull_request", description:"Inspect an existing pull request.", parameters:{type:"object",properties:{number:s},required:["number"]}, requiresPermission:false },
  { name:"ask_user", description:"Ask the user for information needed to continue.", parameters:{type:"object",properties:{question:s},required:["question"]}, requiresPermission:false },
  { name:"web_search", description:"Search the web for external documentation or information.", parameters:{type:"object",properties:{query:s},required:["query"]}, requiresPermission:false },

  { name:"get_project", description:"Read a project in the current organization.", parameters:{type:"object",properties:{projectId:s},required:["projectId"]}, requiresPermission:false },
  { name:"list_tasks", description:"List tasks in a project, optionally filtered by status or text.", parameters:{type:"object",properties:{projectId:s,query:s,statusId:s},required:["projectId"]}, requiresPermission:false },
  { name:"update_task", description:"Update a project task.", parameters:{type:"object",properties:{taskId:s,name:s,description:s,priority:s,statusId:s,targetDate:s},required:["taskId"]}, requiresPermission:true },

  { name:"search_documents", description:"Search organization documents by title or content.", parameters:{type:"object",properties:{query:s},required:["query"]}, requiresPermission:false },
  { name:"read_document", description:"Read an organization document.", parameters:{type:"object",properties:{documentId:s},required:["documentId"]}, requiresPermission:false },
  { name:"create_document", description:"Create an organization document.", parameters:{type:"object",properties:{title:s,content:s,parentId:s},required:["title","content"]}, requiresPermission:true },

  { name:"search_notes", description:"Search organization notes by title or content.", parameters:{type:"object",properties:{query:s},required:["query"]}, requiresPermission:false },
  { name:"read_note", description:"Read an organization note.", parameters:{type:"object",properties:{noteId:s},required:["noteId"]}, requiresPermission:false },
  { name:"update_note", description:"Update an organization note.", parameters:{type:"object",properties:{noteId:s,title:s,content:s},required:["noteId"]}, requiresPermission:true },

  { name:"search_chat", description:"Search messages in a channel the member can access.", parameters:{type:"object",properties:{channelId:s,query:s},required:["channelId","query"]}, requiresPermission:false },
  { name:"send_chat_message", description:"Send a message to a channel the member can access.", parameters:{type:"object",properties:{channelId:s,content:s,threadRootId:s},required:["channelId","content"]}, requiresPermission:true },

  { name:"get_member_profile", description:"Read an organization member's HR profile.", parameters:{type:"object",properties:{memberId:s},required:["memberId"]}, requiresPermission:false },
  { name:"list_leave_requests", description:"List leave requests for the current organization member or a specified member.", parameters:{type:"object",properties:{memberId:s,status:s},required:[]}, requiresPermission:false },
];
