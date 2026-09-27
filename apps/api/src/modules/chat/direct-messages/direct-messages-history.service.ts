import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { directMessage } from "@teamlyf/db";
import { and, count, desc, eq, inArray, isNull, lt } from "drizzle-orm";
import { DATABASE } from "../../../common/db/db.provider";
import { STORAGE_SERVICE, type StorageService } from "../../../common/storage/storage.types";
import { parsePageParams, toMessagePage, type MessagePage } from "../shared/pagination";
import type { ChatMessageDto } from "../shared/message.mapper";
import { requireConversationPartner } from "./conversation-partner";
import { presentDirectMessages } from "./direct-message-presenter";
import type { DirectMessagesQueryDto } from "./dto/direct-messages-query.dto";

@Injectable()
export class DirectMessagesHistoryService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  /**
   * Cursor page of one conversation, newest page first and rows oldest →
   * newest inside the page. `before` (the previous page's `nextCursor`) wins
   * over `page`; one extra row is fetched to learn whether an older page
   * exists without a second count.
   */
  async getConversationHistory(
    organizationId: string,
    memberId: string,
    chatId: string,
    query: DirectMessagesQueryDto,
  ): Promise<MessagePage<ChatMessageDto>> {
    const partner = await requireConversationPartner(this.db, organizationId, chatId);
    const params = parsePageParams(query);
    const cursor = parseCursor(query.before);

    const pair = and(
      eq(directMessage.organizationId, organizationId),
      isNull(directMessage.deletedAt),
      inArray(directMessage.senderId, [memberId, chatId]),
      inArray(directMessage.recipientId, [memberId, chatId]),
    );

    const fetched = await this.db
      .select()
      .from(directMessage)
      .where(cursor ? and(pair, lt(directMessage.createdAt, cursor)) : pair)
      .orderBy(desc(directMessage.createdAt), desc(directMessage.id))
      .limit(params.limit + 1);

    const hasOlderRow = fetched.length > params.limit;
    const pageRows = fetched.slice(0, params.limit);
    pageRows.reverse();

    const [totalRow] = await this.db.select({ total: count() }).from(directMessage).where(pair);

    const messages = await presentDirectMessages({
      db: this.db,
      organizationId,
      currentMemberId: memberId,
      storage: this.storage,
      rows: pageRows,
      conversationFor: () => partner,
    });

    const oldestCreatedAt = pageRows.length > 0 ? pageRows[0].createdAt : null;
    return toMessagePage(messages, hasOlderRow, oldestCreatedAt, totalRow?.total ?? 0, params);
  }
}

/** The cursor is an ISO timestamp of our own making; anything else is a bug. */
function parseCursor(before?: string): Date | null {
  if (!before) return null;
  const parsed = new Date(before);
  if (Number.isNaN(parsed.getTime())) throw new BadRequestException("Invalid before cursor");
  return parsed;
}
