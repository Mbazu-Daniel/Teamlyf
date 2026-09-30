import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { directMessage, messageAttachment } from "@teamlyf/db";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { DATABASE } from "../../../common/db/db.provider";
import { STORAGE_SERVICE, type StorageService } from "../../../common/storage/storage.types";
import {
  loadChatMemberSources,
  toChatParticipant,
  type ChatParticipant,
} from "../shared/member.mapper";
import type { ChatMessageDto } from "../shared/message.mapper";
import { presentDirectMessages } from "./direct-message-presenter";

export type CreateDirectMessageArgs = {
  organizationId: string;

  senderId: string;

  recipientId: string;
  content: string;
  parentMessageId?: string;
  attachmentIds?: string[];
};

export type DeletedDirectMessage = { messageId: string; parentMessageId: string | null };

@Injectable()
export class DirectMessagesService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  async createDirectMessage(args: CreateDirectMessageArgs): Promise<ChatMessageDto> {
    const { organizationId, senderId, recipientId, content } = args;
    if (senderId === recipientId) throw new BadRequestException("Cannot message yourself");

    const sources = await loadChatMemberSources(this.db, organizationId, {
      memberIds: [senderId, recipientId],
    });
    const senderSource = sources.find((source) => source.member.id === senderId);
    const recipientSource = sources.find((source) => source.member.id === recipientId);
    if (!senderSource) throw new ForbiddenException("Not a member of this organization");
    if (!recipientSource) throw new NotFoundException("Recipient not found in this organization");

    if (args.parentMessageId) {
      await this.requireThreadRoot(organizationId, senderId, recipientId, args.parentMessageId);
    }

    const [created] = await this.db
      .insert(directMessage)
      .values({
        organizationId,
        senderId,
        recipientId,
        content,
        parentMessageId: args.parentMessageId ?? null,
      })
      .returning();

    await this.linkAttachments(organizationId, senderId, created.id, args.attachmentIds);

    const partner: ChatParticipant = toChatParticipant(recipientSource);
    const [message] = await presentDirectMessages({
      db: this.db,
      organizationId,
      currentMemberId: senderId,
      storage: this.storage,
      rows: [created],
      conversationFor: () => partner,
    });
    return message;
  }

  async deleteDirectMessage(
    organizationId: string,
    memberId: string,
    messageId: string,
  ): Promise<DeletedDirectMessage> {
    const found = await this.db.query.directMessage.findFirst({
      where: and(
        eq(directMessage.id, messageId),
        eq(directMessage.organizationId, organizationId),
        isNull(directMessage.deletedAt),
      ),
    });
    if (!found) throw new NotFoundException("Message not found");
    if (found.senderId !== memberId) {
      throw new ForbiddenException("Only the sender can delete this message");
    }

    await this.db
      .update(directMessage)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(directMessage.id, found.id));

    return { messageId: found.id, parentMessageId: found.parentMessageId };
  }

  async markConversationAsRead(
    organizationId: string,
    memberId: string,
    partnerId: string,
  ): Promise<{ success: true }> {
    await this.db
      .update(directMessage)
      .set({ readAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(directMessage.organizationId, organizationId),
          eq(directMessage.senderId, partnerId),
          eq(directMessage.recipientId, memberId),
          isNull(directMessage.readAt),
          isNull(directMessage.deletedAt),
        ),
      );
    return { success: true };
  }

  private async requireThreadRoot(
    organizationId: string,
    senderId: string,
    recipientId: string,
    parentMessageId: string,
  ) {
    const parent = await this.db.query.directMessage.findFirst({
      where: and(
        eq(directMessage.id, parentMessageId),
        eq(directMessage.organizationId, organizationId),
        isNull(directMessage.deletedAt),
      ),
    });
    if (!parent) throw new NotFoundException("Parent message not found");

    const involvesSender = parent.senderId === senderId || parent.recipientId === senderId;
    const involvesRecipient = parent.senderId === recipientId || parent.recipientId === recipientId;
    if (!involvesSender || !involvesRecipient) {
      throw new BadRequestException("Parent message is not part of this conversation");
    }
    if (parent.parentMessageId) {
      throw new BadRequestException("Cannot start a thread from a message that is already a reply");
    }
    return parent;
  }

  private async linkAttachments(
    organizationId: string,
    senderId: string,
    messageId: string,
    attachmentIds?: string[],
  ) {
    if (!attachmentIds?.length) return;
    await this.db
      .update(messageAttachment)
      .set({ directMessageId: messageId, updatedAt: new Date() })
      .where(
        and(
          eq(messageAttachment.organizationId, organizationId),
          eq(messageAttachment.memberId, senderId),
          isNull(messageAttachment.directMessageId),
          inArray(messageAttachment.id, attachmentIds),
        ),
      );
  }
}
