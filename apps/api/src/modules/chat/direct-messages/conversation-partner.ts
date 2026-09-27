import { NotFoundException } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { loadChatMemberSources, toChatParticipant, type ChatParticipant } from "../shared/member.mapper";
import type { DirectMessageRow } from "./direct-message-presenter";

/** The other side of a conversation — whoever in the pair is not the caller. */
export function partnerIdOf(row: DirectMessageRow, memberId: string): string {
  return row.senderId === memberId ? row.recipientId : row.senderId;
}

/**
 * `chatId` in every direct-message route is the partner's member id. A
 * conversation is derived from messages, so belonging to the workspace is what
 * proves the pair can exist at all.
 */
export async function requireConversationPartner(
  db: Database,
  organizationId: string,
  chatId: string,
): Promise<ChatParticipant> {
  const [source] = await loadChatMemberSources(db, organizationId, { memberIds: [chatId] });
  if (!source) throw new NotFoundException("Member not found in this organization");
  return toChatParticipant(source);
}
