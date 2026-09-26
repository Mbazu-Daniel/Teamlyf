import { API_URL, client } from "./client";

type AgentRuntimeEvent = {
  id: string;
  sessionId: string;
  runId: string;
  type: string;
  sequence: number;
  payload: Record<string, unknown>;
  createdAt: string;
};

const agentRuntimeApi = {
  sendMessage(organizationId: string, runId: string, message: string) {
    return client.request<{ runId: string; accepted: boolean }>(
      `/organization/${organizationId}/agents/runs/${runId}/messages`,
      { method: "POST", body: JSON.stringify({ message }) },
    );
  },

  interrupt(organizationId: string, runId: string) {
    return client.request<{ runId: string; interrupted: boolean }>(
      `/organization/${organizationId}/agents/runs/${runId}/interrupt`,
      { method: "POST" },
    );
  },

  resume(organizationId: string, runId: string) {
    return client.request<{ runId: string; resumed: boolean }>(
      `/organization/${organizationId}/agents/runs/${runId}/resume`,
      { method: "POST" },
    );
  },

  resolvePermission(
    organizationId: string,
    runId: string,
    requestId: string,
    decision: "once" | "always" | "reject",
  ) {
    return client.request<{ runId: string; requestId: string; decision: string }>(
      `/organization/${organizationId}/agents/runs/${runId}/permissions/${requestId}`,
      { method: "POST", body: JSON.stringify({ decision }) },
    );
  },

  events(organizationId: string, runId: string): EventSource {
    return new EventSource(
      `${API_URL}/organization/${organizationId}/agents/runs/${runId}/events`,
      { withCredentials: true },
    );
  },
};
