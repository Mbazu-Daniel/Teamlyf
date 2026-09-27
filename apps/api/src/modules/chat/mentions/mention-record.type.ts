import type { ChatMessageKind } from "../shared/message.mapper";

/**
 * Exactly what `apps/web/src/features/chat/data/chat-api.ts` reads as
 * `MessageMentionRecord`: newest first, `mentionedBy` always populated for a
 * live member, and only the message key that matches `messageType`.
 */
export type MessageMentionRecord = {
  id: string;
  messageId: string;
  messageType: ChatMessageKind;
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
};
