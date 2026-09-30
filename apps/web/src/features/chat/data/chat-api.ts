import api from "@/features/chat/data/http";
import { Channel } from "@/features/chat/types/channel/types";
import { Message } from "@/features/chat/types/messages/types";
import { ThreadMessage } from "@/features/chat/types/thread-messages/types";

export interface PaginatedMessages {
  messages: Message[];
  total: number;
  page: number;
  totalPages: number;
  nextCursor?: string | null;
  hasMore?: boolean;
}

export interface FetchMessagesOptions {
  limit?: number;
  before?: string;
}

function normalizePaginatedMessages(res: {
  messages?: Message[];
  records?: Message[];
  total?: number;
  totalItems?: number;
  page?: number;
  totalPages?: number;
  pageCount?: number;
  nextCursor?: string | null;
  hasMore?: boolean;
}): PaginatedMessages {
  return {
    messages: res.messages || res.records || [],
    total: res.total ?? res.totalItems ?? 0,
    page: res.page ?? 1,
    totalPages: res.totalPages ?? res.pageCount ?? 1,
    nextCursor: res.nextCursor ?? null,
    hasMore: res.hasMore ?? false,
  };
}

export async function getMessages(
  tenantId: string,
  chatId: string,
  options: FetchMessagesOptions = {},
): Promise<PaginatedMessages> {
  const { limit = 50, before } = options;
  const params: Record<string, string | number> = { limit };
  if (before) {
    params.before = before;
  } else {
    params.page = 1;
  }

  const res = await api.get(`/organization/${tenantId}/direct-messages/conversations/${chatId}`, {
    params,
  });
  return normalizePaginatedMessages(res.data);
}

export async function getChannelMessages(
  tenantId: string,
  channelId: string,
  options: FetchMessagesOptions = {},
): Promise<PaginatedMessages> {
  const { limit = 50, before } = options;
  const params: Record<string, string | number> = { limit };
  if (before) {
    params.before = before;
  } else {
    params.page = 1;
  }

  const res = await api.get(`/organization/${tenantId}/channels/${channelId}/messages`, {
    params,
  });
  return normalizePaginatedMessages(res.data);
}

export async function getDirectThreadMessages(
  tenantId: string,
  chatId: string,
  parentMessageId: string,
): Promise<ThreadMessage[]> {
  const res = await api.get(
    `/organization/${tenantId}/direct-messages/conversations/${chatId}/threads/${parentMessageId}`,
  );
  return res.data.records;
}

export async function getChannelThreadMessages(
  tenantId: string,
  chatId: string,
  parentMessageId: string,
): Promise<ThreadMessage[]> {
  const res = await api.get(
    `/organization/${tenantId}/channels/${chatId}/messages/threads/${parentMessageId}`,
  );
  return res.data.records;
}

export async function getConversations(tenantId: string) {
  const res = await api.get(`/organization/${tenantId}/direct-messages/conversations`);
  return res.data.records;
}

export async function createChannel(tenantId: string, name: string, description: string) {
  const res = await api.post(`/organization/${tenantId}/channels`, {
    name,
    description,
  });
  return res.data;
}

export async function getChannels(tenantId: string): Promise<Channel[]> {
  const res = await api.get(`/organization/${tenantId}/channels`);
  return res.data;
}

export async function joinChannel(tenantId: string, channelId: string) {
  const res = await api.post(`/organization/${tenantId}/channels/${channelId}/join`);
  return res.data;
}

export async function markConversationAsRead(tenantId: string, conversationId: string) {
  const res = await api.post(
    `/organization/${tenantId}/direct-messages/conversations/${conversationId}/read`,
  );
  return res.data;
}

export async function markChannelAsRead(tenantId: string, channelId: string) {
  const res = await api.post(`/organization/${tenantId}/channels/${channelId}/read`);
  return res.data;
}

export async function getChannelMembers(tenantId: string, channelId: string) {
  const res = await api.get(`/organization/${tenantId}/channels/${channelId}/members`);
  return res.data;
}

export async function getUnifiedThreads(
  tenantId: string,
  page: number = 1,
  limit: number = 50,
): Promise<{ records: Message[] }> {
  const res = await api.get(`/organization/${tenantId}/chat/threads`, {
    params: { page, limit },
  });
  return res.data;
}

export async function getMentions(
  tenantId: string,
  memberId: string,
): Promise<MessageMentionRecord[]> {
  const res = await api.get(`/organization/${tenantId}/message-mentions/by-member/${memberId}`);
  return res.data;
}

export interface MessageMentionRecord {
  id: string;
  messageId: string;
  messageType: "channel" | "direct";
  createdAt: string;
  mentionedBy?: {
    id: string;
    firstName?: string;
    lastName?: string;
    preferredName?: string;
    avatar?: string | null;
  };
  channelMessage?: {
    id: string;
    content?: string;
    channelId?: string;
    channel?: { id: string; name?: string };
  };
  directMessage?: {
    id: string;
    content?: string;
    senderId?: string;
    recipientId?: string;
  };
}
