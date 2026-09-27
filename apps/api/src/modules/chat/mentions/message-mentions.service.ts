import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { channel, directMessage, member, message, messageMention } from "@teamlyf/db";
import { and, desc, eq, inArray } from "drizzle-orm";
import { DATABASE } from "../../../common/db/db.provider";
import { loadChatMemberSources, toChatParticipant } from "../shared/member.mapper";
import type { ChatMessageKind } from "../shared/message.mapper";
import type { CreateMentionDto } from "./dto/create-mention.dto";
import type { MessageMentionRecord } from "./mention-record.type";

type MessageMentionRow = typeof messageMention.$inferSelect;

type ChannelMentionMessage = {
  id: string;
  content: string;
  channelId: string;
  channelName: string;
};

type DirectMentionMessage = {
  id: string;
  content: string;
  senderId: string;
  recipientId: string;
};

@Injectable()
export class MessageMentionsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /**
   * Records one mention after the message is sent. Re-posting the same mention
   * (retry, double socket ack) returns the row that already exists instead of
   * stacking duplicates — `message_mention` carries no natural key to conflict on.
   */
  async create(
    organizationId: string,
    mentionedById: string,
    dto: CreateMentionDto,
  ): Promise<MessageMentionRow> {
    await this.requireMessage(organizationId, dto.messageType, dto.messageId);
    await this.requireMember(organizationId, dto.mentionedUserId);

    const [existing] = await this.db
      .select()
      .from(messageMention)
      .where(
        and(
          eq(messageMention.organizationId, organizationId),
          eq(messageMention.messageId, dto.messageId),
          eq(messageMention.messageType, dto.messageType),
          eq(messageMention.mentionedMemberId, dto.mentionedUserId),
          eq(messageMention.mentionedById, mentionedById),
        ),
      )
      .limit(1);
    if (existing) return existing;

    const [created] = await this.db
      .insert(messageMention)
      .values({
        organizationId,
        messageId: dto.messageId,
        messageType: dto.messageType,
        mentionedMemberId: dto.mentionedUserId,
        mentionedById,
      })
      .returning();
    return created;
  }

  /** The mentions inbox: hydrated rows, newest first. */
  async listByMember(organizationId: string, memberId: string): Promise<MessageMentionRecord[]> {
    const rows = await this.db
      .select()
      .from(messageMention)
      .where(
        and(
          eq(messageMention.organizationId, organizationId),
          eq(messageMention.mentionedMemberId, memberId),
        ),
      )
      .orderBy(desc(messageMention.createdAt));

    // Text column: only the two kinds the UI understands become records.
    const mentions = rows.filter(
      (row): row is typeof row & { messageType: ChatMessageKind } =>
        row.messageType === "channel" || row.messageType === "direct",
    );
    if (mentions.length === 0) return [];

    const channelMessageIds = [
      ...new Set(
        mentions.filter((row) => row.messageType === "channel").map((row) => row.messageId),
      ),
    ];
    const directMessageIds = [
      ...new Set(
        mentions.filter((row) => row.messageType === "direct").map((row) => row.messageId),
      ),
    ];

    const [mentioners, channelRows, directRows] = await Promise.all([
      loadChatMemberSources(this.db, organizationId, {
        memberIds: [...new Set(mentions.map((row) => row.mentionedById))],
      }),
      this.loadChannelMessages(organizationId, channelMessageIds),
      this.loadDirectMessages(organizationId, directMessageIds),
    ]);

    const mentionerByMemberId = new Map(
      mentioners.map((source) => [source.member.id, toChatParticipant(source)]),
    );
    const channelByMessageId = new Map(channelRows.map((row) => [row.id, row]));
    const directByMessageId = new Map(directRows.map((row) => [row.id, row]));

    return mentions.map((mention): MessageMentionRecord => {
      const record: MessageMentionRecord = {
        id: mention.id,
        messageId: mention.messageId,
        messageType: mention.messageType,
        createdAt: mention.createdAt.toISOString(),
      };

      const mentioner = mentionerByMemberId.get(mention.mentionedById);
      if (mentioner) record.mentionedBy = mentioner;

      if (mention.messageType === "channel") {
        const channelMessage = channelByMessageId.get(mention.messageId);
        if (channelMessage) {
          record.channelMessage = {
            id: channelMessage.id,
            content: channelMessage.content,
            channelId: channelMessage.channelId,
            channel: { id: channelMessage.channelId, name: channelMessage.channelName },
          };
        }
      } else {
        const direct = directByMessageId.get(mention.messageId);
        if (direct) {
          record.directMessage = {
            id: direct.id,
            content: direct.content,
            senderId: direct.senderId,
            recipientId: direct.recipientId,
          };
        }
      }

      return record;
    });
  }

  private loadChannelMessages(
    organizationId: string,
    messageIds: string[],
  ): Promise<ChannelMentionMessage[]> {
    if (messageIds.length === 0) return Promise.resolve([]);
    return this.db
      .select({
        id: message.id,
        content: message.content,
        channelId: message.channelId,
        channelName: channel.name,
      })
      .from(message)
      .innerJoin(channel, eq(channel.id, message.channelId))
      .where(and(inArray(message.id, messageIds), eq(channel.organizationId, organizationId)));
  }

  private loadDirectMessages(
    organizationId: string,
    messageIds: string[],
  ): Promise<DirectMentionMessage[]> {
    if (messageIds.length === 0) return Promise.resolve([]);
    return this.db
      .select({
        id: directMessage.id,
        content: directMessage.content,
        senderId: directMessage.senderId,
        recipientId: directMessage.recipientId,
      })
      .from(directMessage)
      .where(
        and(
          inArray(directMessage.id, messageIds),
          eq(directMessage.organizationId, organizationId),
        ),
      );
  }

  /** Channel messages are org-scoped through their channel; direct messages directly. */
  private async requireMessage(
    organizationId: string,
    messageType: ChatMessageKind,
    messageId: string,
  ): Promise<void> {
    const found =
      messageType === "direct"
        ? await this.db
            .select({ id: directMessage.id })
            .from(directMessage)
            .where(
              and(
                eq(directMessage.id, messageId),
                eq(directMessage.organizationId, organizationId),
              ),
            )
            .limit(1)
        : await this.db
            .select({ id: message.id })
            .from(message)
            .innerJoin(channel, eq(channel.id, message.channelId))
            .where(and(eq(message.id, messageId), eq(channel.organizationId, organizationId)))
            .limit(1);

    if (found.length === 0) {
      const label = messageType === "direct" ? "Direct" : "Channel";
      throw new NotFoundException(`${label} message not found`);
    }
  }

  /** Keeps `mentioned_member_id` inside this workspace (the FK only checks existence). */
  private async requireMember(organizationId: string, memberId: string): Promise<void> {
    const [found] = await this.db
      .select({ id: member.id })
      .from(member)
      .where(and(eq(member.id, memberId), eq(member.organizationId, organizationId)))
      .limit(1);
    if (!found) throw new NotFoundException("Member not found in this organization");
  }
}
