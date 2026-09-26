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

export type CreateAgentInput = { name: string; description?: string };
export type UpdateAgentInput = { name?: string; description?: string; enabled?: boolean };

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
  run(organizationId: string, agentId: string, input?: unknown) {
    return client.request(`/organization/${organizationId}/agents/${agentId}/runs`, {
      method: "POST",
      body: JSON.stringify(input === undefined ? {} : { input }),
    });
  },
};
