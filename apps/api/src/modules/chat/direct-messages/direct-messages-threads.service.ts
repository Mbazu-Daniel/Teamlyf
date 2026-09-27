import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { directMessage } from "@teamlyf/db";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { DATABASE } from "../../../common/db/db.provider";
import { STORAGE_SERVICE, type StorageService } from "../../../common/storage/storage.types";
import type { ChatMessageDto } from "../shared/message.mapper";
import { requireConversationPartner } from "./conversation-partner";
import { presentDirectMessages } from "./direct-message-presenter";

@Injectable()
export class DirectMessagesThreadsService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  /**
   * The replies hanging off one root message, oldest first. The replies are
   * scoped to the pair as well as the parent, so a parent id from another
   * conversation can never leak its thread into this one.
   */
  async getThreadReplies(
    organizationId: string,
    memberId: string,
    chatId: string,
    parentMessageId: string,
  ): Promise<{ records: ChatMessageDto[] }> {
    const partner = await requireConversationPartner(this.db, organizationId, chatId);
    const parent = await this.requireRoot(organizationId, memberId, chatId, parentMessageId);

    const replies = await this.db
      .select()
      .from(directMessage)
      .where(
        and(
          eq(directMessage.organizationId, organizationId),
          eq(directMessage.parentMessageId, parent.id),
          isNull(directMessage.deletedAt),
          inArray(directMessage.senderId, [memberId, chatId]),
          inArray(directMessage.recipientId, [memberId, chatId]),
        ),
      )
      .orderBy(asc(directMessage.createdAt), asc(directMessage.id));

    const records = await presentDirectMessages({
      db: this.db,
      organizationId,
      currentMemberId: memberId,
      storage: this.storage,
      rows: replies,
      conversationFor: () => partner,
    });

    return { records };
  }

  private async requireRoot(
    organizationId: string,
    memberId: string,
    chatId: string,
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

    const inConversation =
      (parent.senderId === memberId && parent.recipientId === chatId) ||
      (parent.senderId === chatId && parent.recipientId === memberId);
    if (!inConversation) {
      throw new ForbiddenException("Parent message is not part of this conversation");
    }
    return parent;
  }
}
