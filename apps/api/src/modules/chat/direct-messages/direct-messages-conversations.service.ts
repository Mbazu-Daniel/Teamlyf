import { Inject, Injectable } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { directMessage } from "@teamlyf/db";
import { and, desc, eq, isNull, or } from "drizzle-orm";
import { DATABASE } from "../../../common/db/db.provider";
import {
  loadChatMemberSources,
  toChatParticipant,
  type ChatParticipant,
} from "../shared/member.mapper";
import { loadThreadStats } from "../shared/message-related";
import { partnerIdOf } from "./conversation-partner";
import type { DirectMessageRow } from "./direct-message-presenter";

export type DirectMessagePreview = {
  id: string;
  content: string;
  createdAt: string;
  otherMember: ChatParticipant;
  isCurrentUserSender: boolean;
  unreadCount: number;
  hasThreadedMessage: boolean;
  threadCount: number;
  parentMessageId: string | null;
  lastReplyTime: string | null;
};

export type DirectConversationsPage = { records: DirectMessagePreview[] };

const EMPTY_PARTNER: ChatParticipant = { id: "", firstName: "", lastName: "", avatar: null };

@Injectable()
export class DirectMessagesConversationsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async getConversations(
    organizationId: string,
    memberId: string,
  ): Promise<DirectConversationsPage> {
    const rows = await this.db
      .select()
      .from(directMessage)
      .where(
        and(
          eq(directMessage.organizationId, organizationId),
          or(eq(directMessage.senderId, memberId), eq(directMessage.recipientId, memberId)),
          isNull(directMessage.deletedAt),
        ),
      )
      .orderBy(desc(directMessage.createdAt), desc(directMessage.id));

    const latestByPartner = new Map<string, DirectMessageRow>();
    const unreadByPartner = new Map<string, number>();
    for (const row of rows) {
      const partnerId = partnerIdOf(row, memberId);
      if (partnerId === memberId) continue;
      if (!latestByPartner.has(partnerId)) latestByPartner.set(partnerId, row);
      if (row.recipientId === memberId && row.readAt === null) {
        unreadByPartner.set(partnerId, (unreadByPartner.get(partnerId) ?? 0) + 1);
      }
    }

    const partners = [...latestByPartner.keys()];
    const latestRows = [...latestByPartner.values()];
    const [sources, threads] = await Promise.all([
      loadChatMemberSources(this.db, organizationId, { memberIds: partners }),
      loadThreadStats(
        this.db,
        "direct",
        latestRows.map((row) => row.id),
      ),
    ]);
    const sourceById = new Map(sources.map((source) => [source.member.id, source]));

    const records = latestRows.map((row) => {
      const partnerId = partnerIdOf(row, memberId);
      const source = sourceById.get(partnerId);
      const thread = threads.get(row.id) ?? { count: 0, lastReplyTime: null };
      return {
        id: partnerId,
        content: row.content,
        createdAt: row.createdAt.toISOString(),
        otherMember: source ? toChatParticipant(source) : { ...EMPTY_PARTNER, id: partnerId },
        isCurrentUserSender: row.senderId === memberId,
        unreadCount: unreadByPartner.get(partnerId) ?? 0,
        hasThreadedMessage: thread.count > 0,
        threadCount: thread.count,
        parentMessageId: row.parentMessageId,
        lastReplyTime: thread.lastReplyTime ? thread.lastReplyTime.toISOString() : null,
      } satisfies DirectMessagePreview;
    });

    return { records };
  }
}
