import { client } from "./client";
export type DirectMessage = { id: string; organizationId: string; senderId: string; recipientId: string; content: string; parentMessageId: string | null; readAt: string | null; editedAt: string | null; createdAt: string };
export const directMessagesApi = {
  list: (organizationId: string, memberId: string) => client.request<DirectMessage[]>(`/organization/${organizationId}/direct-messages/${memberId}`),
  send: (organizationId: string, recipientId: string, content: string, parentMessageId?: string) => client.request<DirectMessage>(`/organization/${organizationId}/direct-messages`, { method: "POST", body: JSON.stringify({ recipientId, content, parentMessageId }) }),
  markRead: (organizationId: string, messageId: string) => client.request<DirectMessage>(`/organization/${organizationId}/direct-messages/${messageId}/read`, { method: "PATCH" }),
};
