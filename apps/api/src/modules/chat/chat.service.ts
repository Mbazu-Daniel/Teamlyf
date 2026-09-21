import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { agent } from "@teamlyf/db/workspace-schema";
import { channel, channelMember, message, messageReaction } from "@teamlyf/db/workspace-schema";
import { and, eq, inArray, or } from "drizzle-orm";
import { DATABASE } from "../../common/db/db.provider";
import { TenantScopedRepository } from "../../common/db/tenant-scoped.repository";
import { AgentService } from "../agents/agent.service";
import type { CreateChannelDto, CreateMessageDto } from "./dto";

@Injectable()
export class ChatService extends TenantScopedRepository {
  constructor(@Inject(DATABASE) private readonly db: Database, private readonly agents: AgentService) { super(); }

  async listChannels(organizationId: string, memberId: string) {
    const channels = await this.db.query.channel.findMany({ where: eq(channel.organizationId, this.assertOrganizationId(organizationId)) });
    const memberships = await this.db.query.channelMember.findMany({ where: eq(channelMember.memberId, memberId) });
    const joined = new Set(memberships.map((item) => item.channelId));
    return channels.filter((item) => !item.isPrivate || joined.has(item.id));
  }

  async createChannel(organizationId: string, memberId: string, dto: CreateChannelDto) {
    const [created] = await this.db.insert(channel).values({
      organizationId: this.assertOrganizationId(organizationId), name: dto.name, kind: dto.kind ?? "channel",
      isPrivate: dto.kind === "direct" ? true : (dto.isPrivate ?? false), createdById: memberId,
    }).returning();
    const memberIds = [...new Set([memberId, ...(dto.memberIds ?? [])])];
    await this.db.insert(channelMember).values(memberIds.map((id) => ({ channelId: created.id, memberId: id })));
    return created;
  }

  async join(organizationId: string, channelId: string, memberId: string) {
    const found = this.requireScoped(await this.db.query.channel.findFirst({ where: and(eq(channel.id, channelId), eq(channel.organizationId, this.assertOrganizationId(organizationId))) }), "Channel");
    if (found.isPrivate) throw new ForbiddenException("Private channels require an invitation");
    await this.db.insert(channelMember).values({ channelId, memberId }).onConflictDoNothing();
    return { channelId, memberId, joined: true };
  }

  async leave(organizationId: string, channelId: string, memberId: string) {
    const found = await this.db.query.channel.findFirst({ where: and(eq(channel.id, channelId), eq(channel.organizationId, this.assertOrganizationId(organizationId))) });
    this.requireScoped(found, "Channel");
    await this.db.delete(channelMember).where(and(eq(channelMember.channelId, channelId), eq(channelMember.memberId, memberId)));
    return { channelId, memberId, joined: false };
  }

  async history(organizationId: string, channelId: string, memberId: string) {
    await this.requireChannelAccess(organizationId, channelId, memberId);
    const rows = await this.db.query.message.findMany({ where: eq(message.channelId, channelId), orderBy: (t, { asc }) => [asc(t.createdAt)], limit: 100 });
    return this.withReactions(rows);
  }

  async thread(organizationId: string, channelId: string, messageId: string, memberId: string) {
    await this.requireChannelAccess(organizationId, channelId, memberId);
    const rows = await this.db.query.message.findMany({ where: and(eq(message.channelId, channelId), or(eq(message.id, messageId), eq(message.threadRootId, messageId))), orderBy: (t, { asc }) => [asc(t.createdAt)] });
    return this.withReactions(rows);
  }

  async post(organizationId: string, channelId: string, memberId: string, dto: CreateMessageDto) {
    await this.requireChannelAccess(organizationId, channelId, memberId);
    const [created] = await this.db.insert(message).values({ channelId, senderKind: "member", senderId: memberId, content: dto.content, threadRootId: dto.threadRootId ?? null }).returning();
    await this.enqueueMentionedAgents(organizationId, created.id, dto.content);
    return created;
  }

  async addReaction(organizationId: string, channelId: string, messageId: string, memberId: string, emoji: string) {
    await this.requireChannelAccess(organizationId, channelId, memberId);
    const [created] = await this.db.insert(messageReaction).values({ messageId, memberId, emoji }).onConflictDoNothing().returning();
    return created ?? { messageId, memberId, emoji };
  }

  async requireChannelAccess(organizationId: string, channelId: string, memberId: string) {
    const found = await this.db.query.channel.findFirst({ where: and(eq(channel.id, channelId), eq(channel.organizationId, this.assertOrganizationId(organizationId))) });
    if (!found) throw new NotFoundException("Channel not found");
    if (!found.isPrivate) return found;
    const membership = await this.db.query.channelMember.findFirst({ where: and(eq(channelMember.channelId, channelId), eq(channelMember.memberId, memberId)) });
    if (!membership) throw new ForbiddenException("Not a channel member");
    return found;
  }

  private async enqueueMentionedAgents(organizationId: string, messageId: string, content: string) {
    const names = [...content.matchAll(/@([a-zA-Z0-9_-]+)/g)].map((match) => match[1].toLowerCase());
    if (!names.length) return;
    const candidates = await this.db.query.agent.findMany({ where: and(eq(agent.organizationId, organizationId), eq(agent.status, "active")) });
    await Promise.all(candidates.filter((candidate) => names.includes(candidate.name.toLowerCase())).map((candidate) =>
      this.agents.assign(organizationId, { agentId: candidate.id, sourceType: "chat_message", sourceId: messageId, input: { messageId, content } }),
    ));
  }

  private async withReactions<T extends typeof message.$inferSelect>(rows: T[]) {
    if (!rows.length) return rows.map((row) => ({ ...row, reactions: [] as typeof messageReaction.$inferSelect[] }));
    const reactions = await this.db.query.messageReaction.findMany({ where: inArray(messageReaction.messageId, rows.map((row) => row.id)) });
    return rows.map((row) => ({ ...row, reactions: reactions.filter((reaction) => reaction.messageId === row.id) }));
  }
}
