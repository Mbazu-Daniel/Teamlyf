import type { Database } from "@teamlyf/db";
import { directMessage } from "@teamlyf/db";
import type { StorageService } from "../../../common/storage/storage.types";
import { loadChatMemberSourceMap, type ChatParticipant } from "../shared/member.mapper";
import { loadAttachments, loadReactions, loadThreadStats } from "../shared/message-related";
import { toChatMessage, type ChatMessageDto } from "../shared/message.mapper";

export type DirectMessageRow = typeof directMessage.$inferSelect;

type PresentDirectMessagesArgs = {
  db: Database;
  organizationId: string;
  /** The signed-in member — decides `isCurrentUserMessage`. */
  currentMemberId: string;
  rows: DirectMessageRow[];
  storage: StorageService;
  /**
   * The partner these rows belong to. Every conversation is the pair
   * (caller, partner), so the same partner serves a whole page.
   */
  conversationFor: (row: DirectMessageRow) => ChatParticipant;
};

/**
 * Loads senders, attachments, reactions and thread stats for a batch of direct
 * messages and maps them to the DTO the ported chat UI renders. The
 * conversation id reported on each message is the partner's member id, which
 * is what the UI navigates to — there is no conversation table.
 */
export async function presentDirectMessages(
  args: PresentDirectMessagesArgs,
): Promise<ChatMessageDto[]> {
  const { db, organizationId, currentMemberId, rows, storage, conversationFor } = args;
  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.id);
  const senderIds = [...new Set(rows.map((row) => row.senderId))];

  const [senders, attachments, reactions, threads] = await Promise.all([
    loadChatMemberSourceMap(db, organizationId, senderIds),
    loadAttachments(db, organizationId, { directMessageIds: ids }),
    loadReactions(db, organizationId, "direct", ids),
    loadThreadStats(db, "direct", ids),
  ]);

  return Promise.all(
    rows.map((row) => {
      const otherMember = conversationFor(row);
      return toChatMessage({
        row,
        senderSource: senders.get(row.senderId) ?? null,
        storage,
        context: {
          kind: "direct",
          currentMemberId,
          conversation: { id: otherMember.id, otherMember },
        },
        attachments: attachments.get(row.id),
        reactions: reactions.get(row.id),
        thread: threads.get(row.id) ?? { count: 0, lastReplyTime: null },
      });
    }),
  );
}
