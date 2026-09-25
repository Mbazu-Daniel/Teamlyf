import { client } from "./client";
import { projectPath } from "./paths";

export type Status = {
  id: string;
  projectId: string;
  name: string;
  color: string;
  group: string;
  sequence: number;
  default: boolean;
};

const statusesPath = (organizationId: string, projectId: string, statusId?: string) =>
  statusId
    ? `${projectPath(organizationId, projectId)}/statuses/${statusId}`
    : `${projectPath(organizationId, projectId)}/statuses`;

export const statusesApi = {
  getStatuses(organizationId: string, projectId: string) {
    return client.request<Status[]>(statusesPath(organizationId, projectId));
  },
  reorderStatuses(organizationId: string, projectId: string, statusIds: string[]) {
    return client.request<Status[]>(`${statusesPath(organizationId, projectId)}/reorder`, {
      method: "PATCH",
      body: JSON.stringify({ ids: statusIds }),
    });
  },
  createStatus(
    organizationId: string,
    projectId: string,
    input: { name: string; color?: string; group?: string },
  ) {
    return client.request<Status>(statusesPath(organizationId, projectId), {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  updateStatus(
    organizationId: string,
    projectId: string,
    statusId: string,
    input: { name?: string; color?: string; default?: boolean },
  ) {
    return client.request<Status>(statusesPath(organizationId, projectId, statusId), {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
  deleteStatus(organizationId: string, projectId: string, statusId: string) {
    return client.request<null>(statusesPath(organizationId, projectId, statusId), {
      method: "DELETE",
    });
  },
};
