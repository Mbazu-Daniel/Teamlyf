import { client } from "./client";
type NotificationItem = {
  id: string;
  taskId: string;
  taskName: string;
  projectId: string;
  projectName: string;
  actor: string | null;
  verb: string;
  field: string | null;
  createdAt: string;
  readAt: string | null;
};
export const notificationsApi = {
  list: (org: string, scope = "inbox", offset = 0) =>
    client.request<{ items: NotificationItem[]; hasMore: boolean }>(
      `/organization/${org}/notifications`,
      { query: { scope, offset } },
    ),
  read: (org: string, ids: string[]) =>
    client.request(`/organization/${org}/notifications/read`, {
      method: "POST",
      body: JSON.stringify({ ids }),
    }),
};
