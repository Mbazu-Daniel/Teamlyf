import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { message, messageAttachment } from "@teamlyf/db";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { DATABASE } from "../../../common/db/db.provider";
import { STORAGE_SERVICE, type StorageService } from "../../../common/storage/storage.types";
import type { ChatMessageDto } from "../shared/message.mapper";
import { requireChannelMembership, requireChannelRow } from "./channel-access";
import { mapChannelMessages } from "./channel-messages.mapper";

export type CreateChannelMessageArgs = {
  organizationId: string;
  channelId: string;
  /** Member id of the author — `message.senderId`, never the auth user id. */
  senderId: string;
  content: string;
  /** Message being replied to. Replying to a reply still lands on the thread root. */
  parentMessageId?: string;
  /** Ids of the caller's pending `message_attachment` rows to claim. */
  attachmentIds?: string[];
};

export type DeletedChannelMessage = {
  messageId: string;
  parentMessageId: string | null;
};

/**
 * Channel message writes, kept out of any HTTP controller so the socket layer
 * can call the exact same path as a future REST sender.
 *
 * The gateway seam: `createChannelMessage` inserts the row (thread replies set
 * `thread_root_id`), claims the caller's freshly uploaded attachments by
 * pointing them at the new message, and returns the fully mapped `ChatMessage`
 * the broadcast should carry. `deleteChannelMessage` soft-deletes and reports
 * the parent so subscribers can drop the message from a thread as well.
 */
@Injectable()
export class ChannelMessageWriterService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  /**
   * The gateway seam: insert one channel message and return the mapped DTO the
   * broadcast should carry.
   *
   * - `parentMessageId` starts a thread reply; replying to a reply inherits the
   *   original root so every reply of a thread shares one `thread_root_id`.
   * - `attachmentIds` are the sender's pending `message_attachment` rows: they
   *   are claimed only when they belong to this org, this sender, and are still
   *   unlinked.
   * - The DTO is fully mapped (senders, signed attachment URLs, reactions,
   *   thread meta), so callers can emit it as-is.
   */
  async createChannelMessage(args: CreateChannelMessageArgs): Promise<ChatMessageDto> {
    const { organizationId, channelId, senderId, content, parentMessageId, attachmentIds } = args;

    const channelRow = await requireChannelRow(this.db, organizationId, channelId);
    await requireChannelMembership(
      this.db,
      channelId,
      senderId,
      "You must be a member of this channel to send messages",
    );

    const threadRootId = parentMessageId
      ? await this.resolveThreadRoot(channelId, parentMessageId)
      : null;

    const created = await this.db.transaction(async (tx) => {
      const [row] = await tx
        .insert(message)
        .values({ channelId, senderKind: "member", senderId, content, threadRootId })
        .returning();

      if (attachmentIds && attachmentIds.length > 0) {
        await tx
          .update(messageAttachment)
          .set({ channelMessageId: row.id, updatedAt: new Date() })
          .where(
            and(
              inArray(messageAttachment.id, attachmentIds),
              eq(messageAttachment.organizationId, organizationId),
              eq(messageAttachment.memberId, senderId),
              isNull(messageAttachment.channelMessageId),
            ),
          );
      }
      return row;
    });

    const [mapped] = await mapChannelMessages({
      db: this.db,
      storage: this.storage,
      organizationId,
      channel: { id: channelRow.id, name: channelRow.name },
      currentMemberId: senderId,
      rows: [created],
    });
    return mapped;
  }

  /**
   * Soft-delete (`deleted_at`) — only the sender may delete their own message.
   * Returns the thread root so the gateway can drop it from a thread view too
   * (`null` when a root message was deleted).
   */
  async deleteChannelMessage(
    organizationId: string,
    memberId: string,
    messageId: string,
  ): Promise<DeletedChannelMessage> {
    const row = await this.db.query.message.findFirst({
      where: and(eq(message.id, messageId), isNull(message.deletedAt)),
    });
    if (!row) throw new NotFoundException("Message not found");

    await requireChannelRow(this.db, organizationId, row.channelId);
    if (row.senderId !== memberId) {
      throw new ForbiddenException("Only the sender can delete this message");
    }

    await this.db
      .update(message)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(message.id, messageId));

    return { messageId, parentMessageId: row.threadRootId };
  }

  /** Root of the thread this reply belongs to: the parent, or the parent's own root. */
  private async resolveThreadRoot(channelId: string, parentMessageId: string): Promise<string> {
    const parent = await this.db.query.message.findFirst({
      where: and(eq(message.id, parentMessageId), eq(message.channelId, channelId)),
    });
    if (!parent || parent.deletedAt) {
      throw new NotFoundException("Parent message not found in this channel");
    }
    return parent.threadRootId ?? parent.id;
  }
}
