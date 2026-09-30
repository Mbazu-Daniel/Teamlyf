import { ConflictException, ForbiddenException, Inject, Injectable } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import {
  channel,
  channelMember,
  message,
  messageAttachment,
  messageMention,
  messageReaction,
} from "@teamlyf/db";
import { and, desc, eq, inArray } from "drizzle-orm";
import { DATABASE } from "../../../common/db/db.provider";
import { loadChatMemberSources } from "../shared/member.mapper";
import { requireChannelMembership, requireChannelRow } from "./channel-access";
import {
  loadChannelCreators,
  loadUnreadCounts,
  toChannelDto,
  type ChannelDto,
} from "./channel.mapper";
import type { CreateChannelDto } from "./dto/create-channel.dto";

@Injectable()
export class ChannelsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async list(organizationId: string, memberId: string): Promise<ChannelDto[]> {
    const rows = await this.db
      .select()
      .from(channel)
      .where(eq(channel.organizationId, organizationId))
      .orderBy(desc(channel.createdAt));
    if (rows.length === 0) return [];

    const memberships = await this.db
      .select()
      .from(channelMember)
      .where(
        and(
          inArray(
            channelMember.channelId,
            rows.map((row) => row.id),
          ),
          eq(channelMember.memberId, memberId),
        ),
      );

    const [creators, unread] = await Promise.all([
      loadChannelCreators(this.db, organizationId, rows),
      loadUnreadCounts(this.db, memberships),
    ]);
    const joined = new Set(memberships.map((row) => row.channelId));

    return rows.map((row) =>
      toChannelDto({
        row,
        creator: row.createdById ? (creators.get(row.createdById) ?? null) : null,
        unreadCount: unread.get(row.id) ?? 0,
        isMember: joined.has(row.id),
      }),
    );
  }

  async create(
    organizationId: string,
    memberId: string,
    dto: CreateChannelDto,
  ): Promise<ChannelDto> {
    const existing = await this.db.query.channel.findFirst({
      where: and(eq(channel.organizationId, organizationId), eq(channel.name, dto.name)),
    });
    if (existing) {
      throw new ConflictException(`A channel with the name "${dto.name}" already exists`);
    }

    const created = await this.db.transaction(async (tx) => {
      const [row] = await tx
        .insert(channel)
        .values({
          organizationId,
          name: dto.name,
          description: dto.description ?? null,
          createdById: memberId,
        })
        .returning();
      await tx.insert(channelMember).values({ channelId: row.id, memberId }).onConflictDoNothing();
      return row;
    });

    const [creator] = await loadChatMemberSources(this.db, organizationId, {
      memberIds: [memberId],
    });
    return toChannelDto({ row: created, creator: creator ?? null, unreadCount: 0, isMember: true });
  }

  async getOne(organizationId: string, memberId: string, channelId: string): Promise<ChannelDto> {
    const row = await requireChannelRow(this.db, organizationId, channelId);
    const membership = await requireChannelMembership(
      this.db,
      channelId,
      memberId,
      "You must be a member of this channel to view details",
    );

    const [unread, creators] = await Promise.all([
      loadUnreadCounts(this.db, [membership]),
      loadChannelCreators(this.db, organizationId, [row]),
    ]);

    return toChannelDto({
      row,
      creator: row.createdById ? (creators.get(row.createdById) ?? null) : null,
      unreadCount: unread.get(row.id) ?? 0,
      isMember: true,
    });
  }

  async remove(
    organizationId: string,
    memberId: string,
    channelId: string,
  ): Promise<{ message: string }> {
    const channelRow = await requireChannelRow(this.db, organizationId, channelId);
    if (channelRow.createdById !== memberId) {
      throw new ForbiddenException("Only the channel owner can delete this channel");
    }

    await this.db.transaction(async (tx) => {
      const rows = await tx
        .select({ id: message.id })
        .from(message)
        .where(eq(message.channelId, channelId));
      const messageIds = rows.map((row) => row.id);
      if (messageIds.length > 0) {
        const byChannelMessage = and(
          eq(messageAttachment.organizationId, organizationId),
          inArray(messageAttachment.channelMessageId, messageIds),
        );
        await tx.delete(messageAttachment).where(byChannelMessage);
        await tx
          .delete(messageReaction)
          .where(
            and(
              eq(messageReaction.organizationId, organizationId),
              inArray(messageReaction.messageId, messageIds),
            ),
          );
        await tx
          .delete(messageMention)
          .where(
            and(
              eq(messageMention.organizationId, organizationId),
              inArray(messageMention.messageId, messageIds),
            ),
          );
      }
      await tx.delete(message).where(eq(message.channelId, channelId));
      await tx.delete(channelMember).where(eq(channelMember.channelId, channelId));
      await tx.delete(channel).where(eq(channel.id, channelId));
    });

    return { message: "Channel deleted successfully" };
  }
}
