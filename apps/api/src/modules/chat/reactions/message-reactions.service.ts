import { Inject, Injectable } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { messageReaction } from "@teamlyf/db";
import { and, eq } from "drizzle-orm";
import { requireMessageAccess } from "../shared/message-access";
import { DATABASE } from "../../../common/db/db.provider";
import { loadReactions } from "../shared/message-related";
import type { ChatMessageKind } from "../shared/message.mapper";

/** What `GET .../message-reactions/by-message` returns — the UI's `MessageReaction`. */
export type MessageReactionRecord = {
  reaction: string;
  tenantMemberId: string;
};

/** What the gateway emits as `reaction-added` / `reaction-removed`. */
export type ReactionEvent = {
  messageId: string;
  messageType: ChatMessageKind;
  reaction: string;
  tenantMemberId: string;
};

/** Identical arguments for add and remove; `memberId` is the reacting member. */
export type ReactionArgs = {
  organizationId: string;
  messageType: ChatMessageKind;
  messageId: string;
  memberId: string;
  reaction: string;
};

@Injectable()
export class MessageReactionsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async listByMessage(
    organizationId: string,
    messageId: string,
    messageType: ChatMessageKind,
    memberId: string,
  ): Promise<MessageReactionRecord[]> {
    await requireMessageAccess(this.db, organizationId, messageType, messageId, memberId);
    const grouped = await loadReactions(this.db, organizationId, messageType, [messageId]);
    return (grouped.get(messageId) ?? []).map((row) => ({
      reaction: row.emoji,
      tenantMemberId: row.memberId,
    }));
  }

  /**
   * Gateway seam: insert-ignore on the (message, member, emoji) primary key, so
   * a repeated click collapses into one `reaction-added` broadcast instead of
   * failing — and a message outside the organization never gets a row.
   */
  async addReaction(args: ReactionArgs): Promise<ReactionEvent> {
    const { organizationId, messageType, messageId, memberId, reaction } = args;
    await requireMessageAccess(this.db, organizationId, messageType, messageId, memberId);

    await this.db
      .insert(messageReaction)
      .values({ organizationId, messageId, messageType, memberId, emoji: reaction })
      .onConflictDoNothing();

    return { messageId, messageType, reaction, tenantMemberId: memberId };
  }

  /** Gateway seam: deletes only the caller's own row; repeating it stays safe. */
  async removeReaction(args: ReactionArgs): Promise<ReactionEvent> {
    const { organizationId, messageType, messageId, memberId, reaction } = args;
    await requireMessageAccess(this.db, organizationId, messageType, messageId, memberId);

    await this.db
      .delete(messageReaction)
      .where(
        and(
          eq(messageReaction.organizationId, organizationId),
          eq(messageReaction.messageId, messageId),
          eq(messageReaction.messageType, messageType),
          eq(messageReaction.memberId, memberId),
          eq(messageReaction.emoji, reaction),
        ),
      );

    return { messageId, messageType, reaction, tenantMemberId: memberId };
  }

}
