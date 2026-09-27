import { Inject, Injectable } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { channel, channelMember, directMessage, message } from "@teamlyf/db";
import { and, count, eq, inArray, isNotNull, isNull, max, or } from "drizzle-orm";
import { DATABASE } from "../../../common/db/db.provider";
import { STORAGE_SERVICE, type StorageService } from "../../../common/storage/storage.types";
import { partnerIdOf } from "../direct-messages/conversation-partner";
import { presentDirectMessages, type DirectMessageRow } from "../direct-messages/direct-message-presenter";
import { loadChatMemberSourceMap, toChatParticipant } from "../shared/member.mapper";
import { loadAttachments, loadReactions } from "../shared/message-related";
import { parsePageParams, toListEnvelope, type ListEnvelope } from "../shared/pagination";
import { toChatMessage, type ChatMessageDto, type ChatMessageRow, type ChatThreadStats } from "../shared/message.mapper";
import type { ThreadsQueryDto } from "./dto/threads-query.dto";

type ChannelRow = typeof message.$inferSelect;

type ChannelThread = {
  kind: "channel";
  row: ChannelRow;
  channel: { id: string; name: string };
  stats: ChatThreadStats;
};

type DirectThread = { kind: "direct"; row: DirectMessageRow; stats: ChatThreadStats };

type ThreadCandidate = ChannelThread | DirectThread;

type StatsRow = { rootId: string | null; replies: unknown; lastReply: unknown };

@Injectable()
export class ThreadsService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  /**
   * Every root message with at least one reply that the caller can open —
   * channel roots of channels they belong to and direct roots they send or
   * receive — ordered by latest thread activity, paged for the threads screen.
   */
  async getUnifiedThreads(
    organizationId: string,
    memberId: string,
    query: ThreadsQueryDto,
  ): Promise<ListEnvelope<ChatMessageDto>> {
    const params = parsePageParams(query);
    const [channelThreads, directThreads] = await Promise.all([
      this.loadChannelThreads(organizationId, memberId),
      this.loadDirectThreads(organizationId, memberId),
    ]);

    const candidates = [...channelThreads, ...directThreads].sort(
      (a, b) => activityOf(b) - activityOf(a),
    );
    const start = (params.page - 1) * params.limit;
    const pageRows = candidates.slice(start, start + params.limit);
    const records = await this.presentPage(pageRows, organizationId, memberId);

    return toListEnvelope("threads", records, candidates.length, params);
  }

  private async loadChannelThreads(
    organizationId: string,
    memberId: string,
  ): Promise<ChannelThread[]> {
    const memberships = await this.db
      .select({ id: channel.id, name: channel.name })
      .from(channelMember)
      .innerJoin(channel, eq(channel.id, channelMember.channelId))
      .where(and(eq(channelMember.memberId, memberId), eq(channel.organizationId, organizationId)));
    if (memberships.length === 0) return [];

    const channels = new Map(memberships.map((row) => [row.id, { id: row.id, name: row.name }]));
    const channelIds = [...channels.keys()];

    // Only threaded channels matter, so the reply aggregate doubles as the
    // candidate set: roots without replies never become records anyway.
    const replyStats = await this.db
      .select({ rootId: message.threadRootId, replies: count(), lastReply: max(message.createdAt) })
      .from(message)
      .where(
        and(
          isNotNull(message.threadRootId),
          isNull(message.deletedAt),
          inArray(message.channelId, channelIds),
        ),
      )
      .groupBy(message.threadRootId);
    const stats = toStatsMap(replyStats);
    if (stats.size === 0) return [];

    const roots = await this.db
      .select()
      .from(message)
      .where(
        and(
          inArray(message.id, [...stats.keys()]),
          inArray(message.channelId, channelIds),
          isNull(message.deletedAt),
        ),
      );

    const threads: ChannelThread[] = [];
    for (const row of roots) {
      const rootStats = stats.get(row.id);
      const channelInfo = channels.get(row.channelId);
      if (rootStats && channelInfo) {
        threads.push({ kind: "channel", row, channel: channelInfo, stats: rootStats });
      }
    }
    return threads;
  }

  private async loadDirectThreads(
    organizationId: string,
    memberId: string,
  ): Promise<DirectThread[]> {
    const replyStats = await this.db
      .select({
        rootId: directMessage.parentMessageId,
        replies: count(),
        lastReply: max(directMessage.createdAt),
      })
      .from(directMessage)
      .where(
        and(
          eq(directMessage.organizationId, organizationId),
          isNotNull(directMessage.parentMessageId),
          isNull(directMessage.deletedAt),
          or(eq(directMessage.senderId, memberId), eq(directMessage.recipientId, memberId)),
        ),
      )
      .groupBy(directMessage.parentMessageId);
    const stats = toStatsMap(replyStats);
    if (stats.size === 0) return [];

    const roots = await this.db
      .select()
      .from(directMessage)
      .where(
        and(
          eq(directMessage.organizationId, organizationId),
          inArray(directMessage.id, [...stats.keys()]),
          isNull(directMessage.deletedAt),
          or(eq(directMessage.senderId, memberId), eq(directMessage.recipientId, memberId)),
        ),
      );

    const threads: DirectThread[] = [];
    for (const row of roots) {
      const rootStats = stats.get(row.id);
      if (rootStats) threads.push({ kind: "direct", row, stats: rootStats });
    }
    return threads;
  }

  private async presentPage(
    pageRows: ThreadCandidate[],
    organizationId: string,
    memberId: string,
  ): Promise<ChatMessageDto[]> {
    const [channelRecords, directRecords] = await Promise.all([
      this.presentChannelThreads(pageRows.filter(isChannelThread), organizationId, memberId),
      this.presentDirectThreads(pageRows.filter(isDirectThread), organizationId, memberId),
    ]);

    // Re-interleave so the page keeps the activity order it was cut from.
    const records: ChatMessageDto[] = [];
    let channelIndex = 0;
    let directIndex = 0;
    for (const candidate of pageRows) {
      records.push(
        candidate.kind === "channel" ? channelRecords[channelIndex++] : directRecords[directIndex++],
      );
    }
    return records;
  }

  private async presentChannelThreads(
    threads: ChannelThread[],
    organizationId: string,
    memberId: string,
  ): Promise<ChatMessageDto[]> {
    const rows = threads.map((thread) => thread.row);
    const messageIds = rows.map((row) => row.id);
    const senderIds = [...new Set(rows.map((row) => row.senderId))];

    const [senders, attachments, reactions] = await Promise.all([
      loadChatMemberSourceMap(this.db, organizationId, senderIds),
      loadAttachments(this.db, organizationId, { channelMessageIds: messageIds }),
      loadReactions(this.db, organizationId, "channel", messageIds),
    ]);

    return Promise.all(
      threads.map((thread) =>
        toChatMessage({
          row: asChatMessageRow(thread.row),
          senderSource: senders.get(thread.row.senderId) ?? null,
          storage: this.storage,
          context: { kind: "channel", currentMemberId: memberId, channel: thread.channel },
          attachments: attachments.get(thread.row.id),
          reactions: reactions.get(thread.row.id),
          thread: thread.stats,
        }),
      ),
    );
  }

  private async presentDirectThreads(
    threads: DirectThread[],
    organizationId: string,
    memberId: string,
  ): Promise<ChatMessageDto[]> {
    const partnerIds = [...new Set(threads.map((thread) => partnerIdOf(thread.row, memberId)))];
    const partners = await loadChatMemberSourceMap(this.db, organizationId, partnerIds);

    return presentDirectMessages({
      db: this.db,
      organizationId,
      currentMemberId: memberId,
      storage: this.storage,
      rows: threads.map((thread) => thread.row),
      conversationFor: (row) => {
        const partnerId = partnerIdOf(row, memberId);
        const source = partners.get(partnerId);
        return source ? toChatParticipant(source) : { id: partnerId, firstName: "", lastName: "", avatar: null };
      },
    });
  }
}

/** Reply totals keyed by root; aggregate drivers disagree on both types. */
function toStatsMap(rows: StatsRow[]): Map<string, ChatThreadStats> {
  const stats = new Map<string, ChatThreadStats>();
  for (const row of rows) {
    if (!row.rootId) continue;
    stats.set(row.rootId, { count: Number(row.replies), lastReplyTime: toDate(row.lastReply) });
  }
  return stats;
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value !== "string") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Threads rank by their newest reply, falling back to when the root was posted. */
function activityOf(candidate: ThreadCandidate): number {
  return (candidate.stats.lastReplyTime ?? candidate.row.createdAt).getTime();
}

function isChannelThread(candidate: ThreadCandidate): candidate is ChannelThread {
  return candidate.kind === "channel";
}

function isDirectThread(candidate: ThreadCandidate): candidate is DirectThread {
  return candidate.kind === "direct";
}

/** The channel table calls the thread pointer `threadRootId`; the mapper reads `parentMessageId`. */
function asChatMessageRow(row: ChannelRow): ChatMessageRow {
  return {
    id: row.id,
    content: row.content,
    createdAt: row.createdAt,
    editedAt: row.editedAt,
    parentMessageId: row.threadRootId,
    senderId: row.senderId,
  };
}
