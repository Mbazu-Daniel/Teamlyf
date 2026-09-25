import { client } from "./client";
import { taskPath } from "./paths";

export type TaskActivity = {
  id: string;
  taskId: string;
  actorId: string;
  verb: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  comment: string | null;
  createdAt: string;
};

export const taskActivityApi = {
  getActivity(organizationId: string, projectId: string, taskId: string) {
    return client.request<TaskActivity[]>(`${taskPath(organizationId, projectId, taskId)}/activity`);
  },
};
