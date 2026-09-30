export interface MessageAttachment {
  url: string;
  mimeType: string;
  fileSize: number;
}

export interface MessageSender {
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  avatarKey?: string;
  avatar: string | null;
}

export interface MessageReaction {
  reaction: string;
  tenantMemberId: string;
}

export type NotificationMetadata = {
  projectId?: string;
  taskId?: string;
  channelId?: string;
  url?: string;
};

export interface Message {
  id: string;
  channelId?: string;
  conversationId?: string;
  content: string;
  createdAt: string;
  editedAt?: string | null;
  isCurrentUserMessage?: boolean;
  sender: MessageSender;
  attachments?: MessageAttachment[];
  parentMessageId?: string | null;

  hasThreadedMessage?: boolean;
  threadCount?: number;
  lastReplyTime?: string | null;
  type?: "channel" | "direct" | "task" | "alert" | "error" | "system" | "info" | string;
  channel?: {
    id: string;
    name: string;
  };
  conversation?: {
    id: string;
    otherMember: MessageSender;
  };

  status?: "sending" | "success" | "failed";
  attachmentIds?: string[];
  reactions?: MessageReaction[];
  isRead?: boolean;
  metadata?: NotificationMetadata;
}

export interface MessageResponse {
  channelId?: string;
  conversationId?: string;
  message: Message;
}

export interface TypingUser {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
  avatarKey?: string | null;
}

export interface TypingEvent {
  typingUsers: TypingUser[];
  channelId?: string;
  recipientId?: string;
  conversationId?: string;
  senderId?: string;
}
