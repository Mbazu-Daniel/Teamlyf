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

  senderId: string;
  content: string;

  parentMessageId?: string;

  attachmentIds?: string[];
};

export type DeletedChannelMessage = {
  messageId: string;
  parentMessageId: string | null;
};

@Injectable()
export class ChannelMessageWriterService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

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
