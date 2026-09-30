import type { StorageService } from "../../../common/storage/storage.types";
import type { ChatMemberSource, ChatParticipant } from "./member.mapper";
import { toChatParticipant } from "./member.mapper";

export type ChatMessageKind = "channel" | "direct";

export type ChatMessageRow = {
  id: string;
  content: string;
  createdAt: Date;
  editedAt: Date | null;

  parentMessageId: string | null;
  senderId: string;
  readAt?: Date | null;
};

export type ChatAttachmentRow = {
  fileKey: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
};

export type ChatReactionRow = { emoji: string; memberId: string };

export type ChatThreadStats = { count: number; lastReplyTime: Date | null };

export type ChatMessageContext = {
  kind: ChatMessageKind;
  currentMemberId: string;
  channel?: { id: string; name: string } | null;
  conversation?: { id: string; otherMember: ChatParticipant } | null;
};

export type ChatMessageDto = {
  id: string;
  channelId?: string;
  conversationId?: string;
  content: string;
  createdAt: string;
  editedAt: string | null;
  isCurrentUserMessage: boolean;
  sender: ChatParticipant;
  attachments: { url: string; mimeType: string; fileSize: number }[];
  parentMessageId: string | null;
  hasThreadedMessage: boolean;
  threadCount: number;
  lastReplyTime: string | null;
  type: ChatMessageKind;
  channel?: { id: string; name: string };
  conversation?: { id: string; otherMember: ChatParticipant };
  reactions: { reaction: string; tenantMemberId: string }[];
  isRead?: boolean;
};

type ToChatMessageArgs = {
  row: ChatMessageRow;
  senderSource: ChatMemberSource | null;
  storage: StorageService;
  context: ChatMessageContext;
  attachments?: ChatAttachmentRow[];
  reactions?: ChatReactionRow[];
  thread?: ChatThreadStats;
};

async function toAttachmentUrls(
  storage: StorageService,
  rows: ChatAttachmentRow[],
): Promise<ChatMessageDto["attachments"]> {
  return Promise.all(
    rows.map(async (row) => ({
      url: (await storage.createDownloadUrl(row.fileKey, row.originalFileName)).url,
      mimeType: row.mimeType,
      fileSize: row.fileSize,
    })),
  );
}

export async function toChatMessage(args: ToChatMessageArgs): Promise<ChatMessageDto> {
  const { row, senderSource, storage, context } = args;
  const thread = args.thread ?? { count: 0, lastReplyTime: null };
  const sender = senderSource
    ? toChatParticipant(senderSource)
    : { id: row.senderId, firstName: "", lastName: "", avatar: null };

  const message: ChatMessageDto = {
    id: row.id,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    editedAt: row.editedAt ? row.editedAt.toISOString() : null,
    isCurrentUserMessage: row.senderId === context.currentMemberId,
    sender,
    attachments: await toAttachmentUrls(storage, args.attachments ?? []),
    parentMessageId: row.parentMessageId,
    hasThreadedMessage: thread.count > 0,
    threadCount: thread.count,
    lastReplyTime: thread.lastReplyTime ? thread.lastReplyTime.toISOString() : null,
    type: context.kind,
    reactions: (args.reactions ?? []).map((reaction) => ({
      reaction: reaction.emoji,
      tenantMemberId: reaction.memberId,
    })),
  };

  if (context.kind === "channel") {
    if (context.channel) {
      message.channelId = context.channel.id;
      message.channel = context.channel;
    }
  } else {
    if (context.conversation) {
      message.conversationId = context.conversation.id;
      message.conversation = context.conversation;
    }
    message.isRead = Boolean(row.readAt);
  }

  return message;
}
