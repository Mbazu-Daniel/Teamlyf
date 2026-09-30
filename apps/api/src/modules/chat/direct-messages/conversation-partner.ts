import { NotFoundException } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import {
  loadChatMemberSources,
  toChatParticipant,
  type ChatParticipant,
} from "../shared/member.mapper";
import type { DirectMessageRow } from "./direct-message-presenter";

export function partnerIdOf(row: DirectMessageRow, memberId: string): string {
  return row.senderId === memberId ? row.recipientId : row.senderId;
}

export async function requireConversationPartner(
  db: Database,
  organizationId: string,
  chatId: string,
): Promise<ChatParticipant> {
  const [source] = await loadChatMemberSources(db, organizationId, { memberIds: [chatId] });
  if (!source) throw new NotFoundException("Member not found in this organization");
  return toChatParticipant(source);
}
