import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { chatSchema, organizationSchema } from "@teamlyf/db";
import { and, eq, inArray, isNull, lt } from "drizzle-orm";
import { DATABASE } from "../../common/db/db.provider";
import type { CreateChannelDto, CreateMessageDto } from "./chat.dto";

const { channel, channelMember, message, messageReaction } = chatSchema;
const { member } = organizationSchema;
const THREAD_PAGE_SIZE = 100;

@Injectable()
export class ChatService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async listChannels(organizationId: string, memberId: string) {
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

  async history(organizationId: string, channelId: string, memberId: string) {
    await this.requireAccess(organizationId, channelId, memberId);
    const rows = await this.db.query.message.findMany({
      where: and(eq(message.channelId, channelId), isNull(message.threadRootId)),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
      limit: 100,
    });
    return this.withReactions(rows.reverse());
  }

  async thread(organizationId: string, channelId: string, messageId: string, memberId: string, cursor?: string) {
    await this.requireAccess(organizationId, channelId, memberId);
    const root = await this.findThreadRoot(channelId, messageId);
    const cursorDate = this.parseThreadCursor(cursor);
    const rows = await this.findThreadMessages(channelId, messageId, cursorDate);
    return this.withReactions([root, ...rows.reverse()]);
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

  private async requireMember(organizationId: string, memberId: string) {
    const found = await this.db.query.member.findFirst({
      where: and(eq(member.id, memberId), eq(member.organizationId, organizationId)),
    });
    if (!found) throw new ForbiddenException("Member is not in this organization");
    return found;
  }

  private async requireMembers(organizationId: string, memberIds: string[]) {
    const rows = await this.db.query.member.findMany({
      where: and(eq(member.organizationId, organizationId), inArray(member.id, memberIds)),
    });
    if (rows.length !== memberIds.length) throw new ForbiddenException("All channel members must belong to this organization");
  }

  private async withReactions<T extends typeof message.$inferSelect>(rows: T[]) {
    const reactions = rows.length
      ? await this.db.query.messageReaction.findMany({ where: inArray(messageReaction.messageId, rows.map((row) => row.id)) })
      : [];
    const reactionsByMessage = new Map(reactions.map((reaction) => [reaction.messageId, [] as typeof reactions]));
    for (const reaction of reactions) reactionsByMessage.get(reaction.messageId)?.push(reaction);
    return rows.map((row) => ({ ...row, reactions: reactionsByMessage.get(row.id) ?? [] }));
  }
}