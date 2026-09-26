import { z } from "zod";

export const agentToolNames = [
  "read_file",
  "write_file",
  "edit_file",
  "list_directory",
  "search_files",
  "execute_command",
  "git_status",
  "git_diff",
  "git_create_branch",
  "git_commit",
  "git_push",
  "github_create_pull_request",
] as const;

export type AgentToolName = (typeof agentToolNames)[number];

export const agentToolCallSchema = z.object({
  id: z.string().min(1),
  name: z.enum(agentToolNames),
  arguments: z.record(z.unknown()),
});

export type AgentToolCall = z.infer<typeof agentToolCallSchema>;

export const agentToolResultSchema = z.object({
  toolCallId: z.string().min(1),
  name: z.enum(agentToolNames),
  ok: z.boolean(),
  output: z.unknown(),
  error: z.string().optional(),
});

export type AgentToolResult = z.infer<typeof agentToolResultSchema>;

export const agentEventTypes = [
  "session_started",
  "assistant_message",
  "tool_call",
  "tool_result",
  "permission_requested",
  "permission_resolved",
  "run_interrupted",
  "run_failed",
  "run_completed",
] as const;

export type AgentEventType = (typeof agentEventTypes)[number];

export const agentEventSchema = z.object({
  id: z.string().min(1),
  runId: z.string().uuid(),
  type: z.enum(agentEventTypes),
  sequence: z.number().int().nonnegative(),
  payload: z.record(z.unknown()),
  createdAt: z.coerce.date(),
});

export type AgentEvent = z.infer<typeof agentEventSchema>;

export const agentPermissionSchema = z.object({
  tool: z.enum(agentToolNames),
  scope: z.string().min(1),
  reason: z.string().min(1),
  metadata: z.record(z.unknown()).default({}),
});

export type AgentPermissionRequest = z.infer<typeof agentPermissionSchema>;

export const agentWorkspaceSchema = z.object({
  repository: z.string().min(1),
  baseBranch: z.string().min(1),
  workingBranch: z.string().min(1),
  root: z.string().min(1),
});

export type AgentWorkspace = z.infer<typeof agentWorkspaceSchema>;

export const agentSessionSchema = z.object({
  runId: z.string().uuid(),
  agentId: z.string().uuid(),
  organizationId: z.string().uuid(),
  memberId: z.string().uuid(),
  projectId: z.string().uuid(),
  taskId: z.string().uuid(),
  workspace: agentWorkspaceSchema,
});

export type AgentSession = z.infer<typeof agentSessionSchema>;
