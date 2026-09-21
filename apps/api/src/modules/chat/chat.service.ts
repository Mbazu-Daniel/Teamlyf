import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { chatSchema, organizationSchema } from "@teamlyf/db";
import { and, eq, inArray, or } from "drizzle-orm";
import { DATABASE } from "../../common/db/db.provider";
import type { CreateChannelDto, CreateMessageDto } from "./chat.dto";

const { channel, channelMember, message, messageReaction } = chatSchema;
const { member } = organizationSchema;

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
    const [created] = await this.db.insert(channel).values({
      organizationId,
      name: dto.name,
      kind: dto.kind ?? "channel",
      isPrivate: dto.kind === "direct" || dto.isPrivate === true,
      createdById: memberId,
    }).returning();
    await this.db.insert(channelMember).values(memberIds.map((id) => ({ channelId: created.id, memberId: id })));
    return created;
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
      where: eq(message.channelId, channelId),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
      limit: 100,
    });
    return this.withReactions(rows.reverse());
  }

  async thread(organizationId: string, channelId: string, messageId: string, memberId: string) {
    await this.requireAccess(organizationId, channelId, memberId);
    const root = await this.db.query.message.findFirst({
      where: and(eq(message.id, messageId), eq(message.channelId, channelId)),
    });
    if (!root) throw new NotFoundException("Message not found");
    const rows = await this.db.query.message.findMany({
      where: and(eq(message.channelId, channelId), or(eq(message.id, messageId), eq(message.threadRootId, messageId))),
      orderBy: (table, { asc }) => [asc(table.createdAt)],
    });
    return this.withReactions(rows);
  }

  async post(organizationId: string, channelId: string, memberId: string, dto: CreateMessageDto) {
    await this.requireAccess(organizationId, channelId, memberId);
    if (dto.threadRootId) {
      const root = await this.db.query.message.findFirst({
        where: and(eq(message.id, dto.threadRootId), eq(message.channelId, channelId)),
      });
      if (!root) throw new NotFoundException("Thread root not found");
    }
    const [created] = await this.db.insert(message).values({
      channelId,
      senderKind: "member",
      senderId: memberId,
      content: dto.content,
      threadRootId: dto.threadRootId ?? null,
    }).returning();
    return created;
  }

  async addReaction(organizationId: string, channelId: string, messageId: string, memberId: string, emoji: string) {
    await this.requireAccess(organizationId, channelId, memberId);
    const target = await this.db.query.message.findFirst({
      where: and(eq(message.id, messageId), eq(message.channelId, channelId)),
    });
    if (!target) throw new NotFoundException("Message not found");
    const [created] = await this.db.insert(messageReaction).values({ messageId, memberId, emoji }).onConflictDoNothing().returning();
    return created ?? { messageId, memberId, emoji };
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
    return rows.map((row) => ({
      ...row,
      reactions: reactions.filter((reaction) => reaction.messageId === row.id),
    }));
  }
}