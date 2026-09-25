import { client } from "./client";
import { projectPath } from "./paths";

type Label = {
  id: string;
  projectId: string;
  parentId: string | null;
  name: string;
  description: string | null;
  color: string;
  sequence: number;
};

const labelsPath = (organizationId: string, projectId: string, labelId?: string) =>
  labelId
    ? `${projectPath(organizationId, projectId)}/labels/${labelId}`
    : `${projectPath(organizationId, projectId)}/labels`;

export const labelsApi = {
  getLabels(organizationId: string, projectId: string) {
    return client.request<Label[]>(labelsPath(organizationId, projectId));
  },
  reorderLabels(organizationId: string, projectId: string, labelIds: string[]) {
    return client.request<Label[]>(`${labelsPath(organizationId, projectId)}/reorder`, {
      method: "PATCH",
      body: JSON.stringify({ ids: labelIds }),
    });
  },
  createLabel(
    organizationId: string,
    projectId: string,
    input: { name: string; color?: string; description?: string; parentId?: string },
  ) {
    return client.request<Label>(labelsPath(organizationId, projectId), {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  updateLabel(
    organizationId: string,
    projectId: string,
    labelId: string,
    input: { name?: string; color?: string; description?: string },
  ) {
    return client.request<Label>(labelsPath(organizationId, projectId, labelId), {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
  deleteLabel(organizationId: string, projectId: string, labelId: string) {
    return client.request<null>(labelsPath(organizationId, projectId, labelId), {
      method: "DELETE",
    });
  },
};
