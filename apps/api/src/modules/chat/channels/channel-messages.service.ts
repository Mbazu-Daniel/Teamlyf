import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { message } from "@teamlyf/db";
import { and, asc, count, desc, eq, gte, ilike, isNull, lt, lte } from "drizzle-orm";
import { DATABASE } from "../../../common/db/db.provider";
import { STORAGE_SERVICE, type StorageService } from "../../../common/storage/storage.types";
import type { ChatMessageDto } from "../shared/message.mapper";
import { parsePageParams, toMessagePage, type MessagePage } from "../shared/pagination";
import { requireChannelMembership, requireChannelRow } from "./channel-access";
import { mapChannelMessages } from "./channel-messages.mapper";
import type { ChannelMessagesQueryDto } from "./dto/channel-messages-query.dto";
import type { ChannelSearchQueryDto } from "./dto/channel-search-query.dto";

@Injectable()
export class ChannelMessagesService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  /**
   * The newest page of root messages, oldest → newest inside the page. One row
   * past `limit` tells the client whether an older page exists, and the page's
   * oldest `createdAt` is the cursor for it.
   */
  async list(
    organizationId: string,
    memberId: string,
    channelId: string,
    query: ChannelMessagesQueryDto,
  ): Promise<MessagePage<ChatMessageDto>> {
    const channelRow = await requireChannelRow(this.db, organizationId, channelId);
    await requireChannelMembership(
      this.db,
      channelId,
      memberId,
      "You must be a member of this channel to view messages",
    );

    const params = parsePageParams(query);
    const cursor = parseBeforeCursor(query.before);
    const roots = and(isNull(message.threadRootId), isNull(message.deletedAt));

    const [rows, totalRow] = await Promise.all([
      this.db
        .select()
        .from(message)
        .where(
          and(eq(message.channelId, channelId), roots, cursor ? lt(message.createdAt, cursor) : undefined),
        )
        .orderBy(desc(message.createdAt), desc(message.id))
        .limit(params.limit + 1),
      this.db
        .select({ total: count() })
        .from(message)
        .where(and(eq(message.channelId, channelId), roots)),
    ]);

    const hasOlderRow = rows.length > params.limit;
    const pageRows = (hasOlderRow ? rows.slice(0, params.limit) : rows).reverse();

    const messages = await this.mapPage(organizationId, channelRow.id, channelRow.name, memberId, pageRows);
    return toMessagePage(
      messages,
      hasOlderRow,
      pageRows[0]?.createdAt ?? null,
      Number(totalRow[0]?.total ?? 0),
      params,
    );
  }

  /** Every reply to `parentMessageId`, oldest → newest, as `{ records }`. */
  async thread(
    organizationId: string,
    memberId: string,
    channelId: string,
    parentMessageId: string,
  ): Promise<{ records: ChatMessageDto[] }> {
    const channelRow = await requireChannelRow(this.db, organizationId, channelId);
    await requireChannelMembership(
      this.db,
      channelId,
      memberId,
      "You must be a member of this channel to view thread messages",
    );

    const rows = await this.db
      .select()
      .from(message)
      .where(
        and(
          eq(message.channelId, channelId),
          eq(message.threadRootId, parentMessageId),
          isNull(message.deletedAt),
        ),
      )
      .orderBy(asc(message.createdAt), asc(message.id));

    return { records: await this.mapPage(organizationId, channelRow.id, channelRow.name, memberId, rows) };
  }

  /** Filtered message search over the channel, newest first. */
  async search(
    organizationId: string,
    memberId: string,
    channelId: string,
    query: ChannelSearchQueryDto,
  ): Promise<{ messages: ChatMessageDto[]; total: number; limit: number; offset: number }> {
    const channelRow = await requireChannelRow(this.db, organizationId, channelId);
    await requireChannelMembership(
      this.db,
      channelId,
      memberId,
      "You must be a member of this channel to search messages",
    );

    const limit = Math.min(Math.max(query.limit ?? 10, 1), 100);
    const offset = Math.max(query.offset ?? 0, 0);
    const conditions = [eq(message.channelId, channelId), isNull(message.deletedAt)];
    if (query.q) conditions.push(ilike(message.content, `%${escapeLike(query.q)}%`));
    if (query.senderId) conditions.push(eq(message.senderId, query.senderId));
    if (query.dateFrom) conditions.push(gte(message.createdAt, new Date(query.dateFrom)));
    if (query.dateTo) conditions.push(lte(message.createdAt, new Date(query.dateTo)));

    const [totalRow, rows] = await Promise.all([
      this.db.select({ total: count() }).from(message).where(and(...conditions)),
      this.db
        .select()
        .from(message)
        .where(and(...conditions))
        .orderBy(desc(message.createdAt), desc(message.id))
        .limit(limit)
        .offset(offset),
    ]);

    const messages = await this.mapPage(organizationId, channelRow.id, channelRow.name, memberId, rows);
    return { messages, total: Number(totalRow[0]?.total ?? 0), limit, offset };
  }

  private mapPage(
    organizationId: string,
    channelId: string,
    channelName: string,
    memberId: string,
    rows: (typeof message.$inferSelect)[],
  ): Promise<ChatMessageDto[]> {
    return mapChannelMessages({
      db: this.db,
      storage: this.storage,
      organizationId,
      channel: { id: channelId, name: channelName },
      currentMemberId: memberId,
      rows,
    });
  }
}

/** The cursor is the ISO `createdAt` of the last message the client holds. */
function parseBeforeCursor(before?: string): Date | null {
  if (!before) return null;
  const cursor = new Date(before);
  if (Number.isNaN(cursor.getTime())) {
    throw new BadRequestException("Invalid `before` cursor — expected an ISO timestamp");
  }
  return cursor;
}

/** Keeps `%` and `_` typed by a user from turning into LIKE wildcards. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}
