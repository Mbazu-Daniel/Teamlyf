import { client } from "../api";

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
};

export const chatApi = {
  messages(organizationId: string, conversationId: string) {
    return client.request<ChatMessage[]>(
      "/organization/" + organizationId + "/conversations/" + conversationId + "/messages",
    );
  },
};
