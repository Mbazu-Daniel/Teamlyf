import { client } from "./client";

export type Agent = {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AgentRun = {
  id: string;
  organizationId: string;
  agentId: string;
  memberId: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  input: unknown;
  output: unknown;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AgentPermissionPolicy = {
  id: string;
  organizationId: string;
  memberId: string;
  agentId: string;
  tool: string;
  effect: "allow" | string;
  createdAt: string;
  updatedAt: string;
};

type CreateAgentInput = { name: string; description?: string };
type UpdateAgentInput = { name?: string; description?: string; enabled?: boolean };

export const agentsApi = {
  list(organizationId: string) {
    return client.request<Agent[]>(`/organization/${organizationId}/agents`);
  },
  create(organizationId: string, input: CreateAgentInput) {
    return client.request<Agent>(`/organization/${organizationId}/agents`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  update(organizationId: string, agentId: string, input: UpdateAgentInput) {
    return client.request<Agent>(`/organization/${organizationId}/agents/${agentId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
  delete(organizationId: string, agentId: string) {
    return client.request<Agent>(`/organization/${organizationId}/agents/${agentId}`, {
      method: "DELETE",
    });
  },
  runs(organizationId: string, agentId: string) {
    return client.request<AgentRun[]>(`/organization/${organizationId}/agents/${agentId}/runs`);
  },
  run(organizationId: string, agentId: string, input?: unknown) {
    return client.request<AgentRun>(`/organization/${organizationId}/agents/${agentId}/runs`, {
      method: "POST",
      body: JSON.stringify(input === undefined ? {} : { input }),
    });
  },
  permissions(organizationId: string, agentId: string) {
    return client.request<AgentPermissionPolicy[]>(
      `/organization/${organizationId}/agents/${agentId}/permissions`,
    );
  },
  revokePermission(organizationId: string, agentId: string, tool: string) {
    return client.request<void>(
      `/organization/${organizationId}/agents/${agentId}/permissions/${encodeURIComponent(tool)}`,
      { method: "DELETE" },
    );
  },
};
