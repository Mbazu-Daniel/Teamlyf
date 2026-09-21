/** Shared, transport-safe contracts. Domain-specific API DTOs remain in the API. */
export type SubjectKind = "member" | "agent";

export type AgentAssignee = {
  kind: "agent";
  id: string;
};

export type MemberAssignee = {
  kind: "member";
  id: string;
};

export type TaskAssignee = AgentAssignee | MemberAssignee;

export type AgentTaskStatus =
  | "queued"
  | "running"
  | "awaiting_approval"
  | "completed"
  | "failed"
  | "cancelled";

export type ApprovalStatus = "not_required" | "pending" | "approved" | "rejected";

export type AgentTaskEnvelope = {
  id: string;
  organizationId: string;
  agentId: string;
  sourceType: string;
  sourceId: string;
  input: Record<string, unknown>;
};

export type UploadDescriptor = {
  key: string;
  url: string;
  expiresAt: string;
};
