import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { chatSchema, organizationSchema } from "@teamlyf/db";
import { and, eq, ilike, inArray, isNull, lt } from "drizzle-orm";
import { DATABASE } from "../../common/db/db.provider";
import type { CreateChannelDto, CreateMessageDto } from "./chat.dto";
import { requireOrganizationMember } from "../../common/organization-member";

const { channel, channelMember, message, messageReaction } = chatSchema;
const { member } = organizationSchema;
const THREAD_PAGE_SIZE = 100;

@Injectable()
export class ChatService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async getChannels(organizationId: string, memberId: string) {
    const [channels, memberships] = await Promise.all([
      this.db.query.channel.findMany({ where: eq(channel.organizationId, organizationId) }),
      this.db.query.channelMember.findMany({ where: eq(channelMember.memberId, memberId) }),
    ]);
    const joined = new Set(memberships.map((item) => item.channelId));
    return channels.filter((item) => !item.isPrivate || joined.has(item.id));
  }

  async createChannel(organizationId: string, memberId: string, dto: CreateChannelDto) {
    await this.requireMember(organizationId, memberId);
    const memberIds = [...new Set([memberId, ...(dto.memberIds ?? [])])];
    await this.requireMembers(organizationId, memberIds);
    return this.db.transaction(async (tx) => {
      const [created] = await tx.insert(channel).values({
        organizationId,
        name: dto.name,
        kind: dto.kind ?? "channel",
        isPrivate: dto.kind === "direct" || dto.isPrivate === true,
        createdById: memberId,
      }).returning();

      await tx.insert(channelMember).values(
        memberIds.map((id) => ({ channelId: created.id, memberId: id })),
      );

      return created;
    });
  }

  async join(organizationId: string, channelId: string, memberId: string) {
    const found = await this.requireChannel(organizationId, channelId);
    await this.requireMember(organizationId, memberId);
    if (found.isPrivate) throw new ForbiddenException("Private channels require membership");
    await this.db.insert(channelMember).values({ channelId, memberId }).onConflictDoNothing();
    return { channelId, memberId, joined: true };
  }

  async leave(organizationId: string, channelId: string, memberId: string) {
    await this.requireChannel(organizationId, channelId);
    await this.db.delete(channelMember).where(and(eq(channelMember.channelId, channelId), eq(channelMember.memberId, memberId)));
    return { channelId, memberId, joined: false };
  }

  async getChannel(organizationId: string, channelId: string, memberId: string) {
    return this.requireAccess(organizationId, channelId, memberId);
  }

  async deleteChannel(organizationId: string, channelId: string, memberId: string) {
    // Messages, memberships and reactions cascade from the channel FK.
    await this.requireAccess(organizationId, channelId, memberId);
    const [deleted] = await this.db
      .delete(channel)
      .where(and(eq(channel.id, channelId), eq(channel.organizationId, organizationId)))
      .returning();
    if (!deleted) throw new NotFoundException("Channel not found");
    return deleted;
  }

  async listMembers(organizationId: string, channelId: string, memberId: string) {
    await this.requireAccess(organizationId, channelId, memberId);
    return this.channelRoster(channelId);
  }

  async addMembers(organizationId: string, channelId: string, memberId: string, memberIds: string[]) {
    await this.requireAccess(organizationId, channelId, memberId);
    const unique = [...new Set(memberIds)];
    await this.requireMembers(organizationId, unique);
    await this.db.insert(channelMember)
      .values(unique.map((id) => ({ channelId, memberId: id })))
      .onConflictDoNothing();
    return this.channelRoster(channelId);
  }

  async markRead(organizationId: string, channelId: string, memberId: string) {
    await this.requireAccess(organizationId, channelId, memberId);
    const membership = await this.db.query.channelMember.findFirst({
      where: and(eq(channelMember.channelId, channelId), eq(channelMember.memberId, memberId)),
    });
    if (!membership) throw new ForbiddenException("Join the channel to mark it read");
    const [updated] = await this.db
      .update(channelMember)
      .set({ lastReadAt: new Date() })
      .where(and(eq(channelMember.channelId, channelId), eq(channelMember.memberId, memberId)))
      .returning();
    return updated;
  }

  private async channelRoster(channelId: string) {
    const memberships = await this.db.query.channelMember.findMany({
      where: eq(channelMember.channelId, channelId),
      orderBy: (table, { asc }) => [asc(table.joinedAt)],
    });
    if (!memberships.length) return [];
    const memberRows = await this.db.query.member.findMany({
      where: inArray(member.id, memberships.map((row) => row.memberId)),
      columns: { id: true, firstName: true, lastName: true, role: true },
    });
    const byId = new Map(memberRows.map((row) => [row.id, row]));
    return memberships
      .map((row) => ({ ...row, member: byId.get(row.memberId) ?? null }))
      .filter((row) => row.member !== null);
  }

  async history(organizationId: string, channelId: string, memberId: string) {
    await this.requireAccess(organizationId, channelId, memberId);
    const rows = await this.db.query.message.findMany({
      where: and(eq(message.channelId, channelId), isNull(message.threadRootId)),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
      limit: 100,
    });
    return this.withMessageMetadata(rows.reverse(), organizationId);
  }

  async thread(organizationId: string, channelId: string, messageId: string, memberId: string, cursor?: string) {
    await this.requireAccess(organizationId, channelId, memberId);
    const root = await this.findThreadRoot(channelId, messageId);
    const cursorDate = this.parseThreadCursor(cursor);
    const rows = await this.findThreadMessages(channelId, messageId, cursorDate);
    return this.withMessageMetadata([root, ...rows.reverse()], organizationId);
  }

  private async findThreadRoot(channelId: string, messageId: string) {
    const root = await this.db.query.message.findFirst({
      where: and(eq(message.id, messageId), eq(message.channelId, channelId)),
    });
    if (!root || root.threadRootId !== null) throw new NotFoundException("Thread root not found");
    return root;
  }

  private parseThreadCursor(cursor?: string) {
    if (!cursor) return null;
    const date = new Date(cursor);
    if (Number.isNaN(date.getTime())) throw new ForbiddenException("Invalid thread cursor");
    return date;
  }

  private async findThreadMessages(channelId: string, messageId: string, cursor: Date | null) {
    const where = cursor
      ? and(
          eq(message.channelId, channelId),
          eq(message.threadRootId, messageId),
          lt(message.createdAt, cursor),
        )
      : and(eq(message.channelId, channelId), eq(message.threadRootId, messageId));

    return this.db.query.message.findMany({
      where,
      orderBy: (table, { desc }) => [desc(table.createdAt)],
      limit: THREAD_PAGE_SIZE,
    });
  }

  async post(organizationId: string, channelId: string, memberId: string, dto: CreateMessageDto) {
    await this.requireAccess(organizationId, channelId, memberId);
    await this.validateThreadRoot(channelId, dto.threadRootId);
    return this.insertMessage(channelId, memberId, dto);
  }

  private async validateThreadRoot(channelId: string, threadRootId?: string) {
    if (!threadRootId) return;
    const root = await this.db.query.message.findFirst({
      where: and(eq(message.id, threadRootId), eq(message.channelId, channelId)),
    });
    if (!root) throw new NotFoundException("Thread root not found");
    if (root.threadRootId !== null) throw new ForbiddenException("Thread replies must target a root message");
  }

  private insertMessage(channelId: string, memberId: string, dto: CreateMessageDto) {
    return this.db.insert(message).values({
      channelId,
      senderKind: "member",
      senderId: memberId,
      content: dto.content,
      threadRootId: dto.threadRootId ?? null,
    }).returning().then(([created]) => created);
  }

  async addReaction(organizationId: string, channelId: string, messageId: string, memberId: string, emoji: string) {
    await this.requireAccess(organizationId, channelId, memberId);
    const target = await this.db.query.message.findFirst({
      where: and(eq(message.id, messageId), eq(message.channelId, channelId)),
    });
    if (!target) throw new NotFoundException("Message not found");
    const [created] = await this.db
      .insert(messageReaction)
      .values({ messageId, memberId, emoji })
      .onConflictDoNothing()
      .returning();

    if (created) return created;

    const existing = await this.db.query.messageReaction.findFirst({
      where: and(
        eq(messageReaction.messageId, messageId),
        eq(messageReaction.memberId, memberId),
        eq(messageReaction.emoji, emoji),
      ),
    });

    return existing ?? { messageId, memberId, emoji };
  }

  async removeReaction(organizationId: string, channelId: string, messageId: string, memberId: string, emoji: string) {
    await this.requireAccess(organizationId, channelId, memberId);
    await this.requireChannelMessage(channelId, messageId);
    const [deleted] = await this.db
      .delete(messageReaction)
      .where(
        and(
          eq(messageReaction.messageId, messageId),
          eq(messageReaction.memberId, memberId),
          eq(messageReaction.emoji, emoji),
        ),
      )
      .returning();
    if (!deleted) throw new NotFoundException("Reaction not found");
    return deleted;
  }

  async editMessage(organizationId: string, channelId: string, messageId: string, memberId: string, content: string) {
    await this.requireAccess(organizationId, channelId, memberId);
    const target = await this.requireOwnMessage(channelId, messageId, memberId);
    const [updated] = await this.db
      .update(message)
      .set({ content, updatedAt: new Date() })
      .where(eq(message.id, target.id))
      .returning();
    return updated;
  }

  async deleteMessage(organizationId: string, channelId: string, messageId: string, memberId: string) {
    // Reactions and thread replies cascade from the message FK.
    await this.requireAccess(organizationId, channelId, memberId);
    const target = await this.requireOwnMessage(channelId, messageId, memberId);
    const [deleted] = await this.db
      .delete(message)
      .where(eq(message.id, target.id))
      .returning();
    return deleted;
  }

  async searchMessages(organizationId: string, channelId: string, memberId: string, q: string) {
    await this.requireAccess(organizationId, channelId, memberId);
    const pattern = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
    const rows = await this.db.query.message.findMany({
      where: and(eq(message.channelId, channelId), ilike(message.content, pattern)),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
      limit: 50,
    });
    return this.withMessageMetadata(rows, organizationId);
  }

  private async requireChannelMessage(channelId: string, messageId: string) {
    const target = await this.db.query.message.findFirst({
      where: and(eq(message.id, messageId), eq(message.channelId, channelId)),
    });
    if (!target) throw new NotFoundException("Message not found");
    return target;
  }

  /** Messages are only editable/deletable by their sender. */
  private async requireOwnMessage(channelId: string, messageId: string, memberId: string) {
    const target = await this.requireChannelMessage(channelId, messageId);
    if (target.senderKind !== "member" || target.senderId !== memberId) {
      throw new ForbiddenException("You can only modify your own messages");
    }
    return target;
  }

  private async requireAccess(organizationId: string, channelId: string, memberId: string) {
    const found = await this.requireChannel(organizationId, channelId);
    await this.requireMember(organizationId, memberId);
    if (!found.isPrivate) return found;
    const membership = await this.db.query.channelMember.findFirst({
      where: and(eq(channelMember.channelId, channelId), eq(channelMember.memberId, memberId)),
    });
    if (!membership) throw new ForbiddenException("Not a channel member");
    return found;
  }

  private async requireChannel(organizationId: string, channelId: string) {
    const found = await this.db.query.channel.findFirst({
      where: and(eq(channel.id, channelId), eq(channel.organizationId, organizationId)),
    });
    if (!found) throw new NotFoundException("Channel not found");
    return found;
  }

  private requireMember(organizationId: string, memberId: string) {
    return requireOrganizationMember(this.db, organizationId, memberId);
  }

  private async requireMembers(organizationId: string, memberIds: string[]) {
    const rows = await this.db.query.member.findMany({
      where: and(eq(member.organizationId, organizationId), inArray(member.id, memberIds)),
    });
    if (rows.length !== memberIds.length) throw new ForbiddenException("All channel members must belong to this organization");
  }

  private async withMessageMetadata<T extends typeof message.$inferSelect>(rows: T[], organizationId: string) {
    if (!rows.length) return [];

    const [reactions, members] = await Promise.all([
      this.db.query.messageReaction.findMany({
        where: inArray(messageReaction.messageId, rows.map((row) => row.id)),
      }),
      this.db.query.member.findMany({
        where: and(
          eq(member.organizationId, organizationId),
          inArray(member.id, rows.map((row) => row.senderId).filter((id): id is string => Boolean(id))),
        ),
        columns: { id: true, firstName: true, lastName: true },
      }),
    ]);

    const reactionsByMessage = new Map<string, typeof reactions>();
    for (const reaction of reactions) {
      const list = reactionsByMessage.get(reaction.messageId) ?? [];
      list.push(reaction);
      reactionsByMessage.set(reaction.messageId, list);
    }

    const membersById = new Map(members.map((item) => [item.id, item]));

    return rows.map((row) => ({
      ...row,
      sender: row.senderId ? membersById.get(row.senderId) ?? null : null,
      reactions: reactionsByMessage.get(row.id) ?? [],
    }));
  }
}