import type { Database } from "@teamlyf/db";
import { message } from "@teamlyf/db";
import type { StorageService } from "../../../common/storage/storage.types";
import { loadChatMemberSourceMap } from "../shared/member.mapper";
import type { ChatMessageContext, ChatMessageDto } from "../shared/message.mapper";
import { toChatMessage } from "../shared/message.mapper";
import { loadAttachments, loadReactions, loadThreadStats } from "../shared/message-related";

type MessageRow = typeof message.$inferSelect;

type MapChannelMessagesArgs = {
  db: Database;
  storage: StorageService;
  organizationId: string;
  channel: { id: string; name: string };

  currentMemberId: string;
  rows: MessageRow[];
};

export async function mapChannelMessages(args: MapChannelMessagesArgs): Promise<ChatMessageDto[]> {
  const { db, storage, organizationId, channel, currentMemberId, rows } = args;
  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.id);
  const senderIds = [...new Set(rows.map((row) => row.senderId))];

  const [senders, attachments, reactions, threads] = await Promise.all([
    loadChatMemberSourceMap(db, organizationId, senderIds),
    loadAttachments(db, organizationId, { channelMessageIds: ids }),
    loadReactions(db, organizationId, "channel", ids),
    loadThreadStats(db, "channel", ids),
  ]);

  const context: ChatMessageContext = { kind: "channel", currentMemberId, channel };

  return Promise.all(
    rows.map((row) =>
      toChatMessage({
        row: {
          id: row.id,
          content: row.content,
          createdAt: row.createdAt,
          editedAt: row.editedAt,
          parentMessageId: row.threadRootId,
          senderId: row.senderId,
        },
        senderSource: senders.get(row.senderId) ?? null,
        storage,
        context,
        attachments: attachments.get(row.id),
        reactions: reactions.get(row.id),
        thread: threads.get(row.id),
      }),
    ),
  );
}
