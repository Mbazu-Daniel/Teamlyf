import { ForbiddenException, NotFoundException } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { channel, directMessage, message } from "@teamlyf/db";
import { and, eq, isNull } from "drizzle-orm";
import { requireChannelMembership } from "../channels/channel-access";
import type { ChatMessageKind } from "./message.mapper";

export async function requireMessageAccess(
  db: Database,
  organizationId: string,
  messageType: ChatMessageKind,
  messageId: string,
  memberId: string,
) {
  if (messageType === "direct") {
    const found = await db.query.directMessage.findFirst({
      where: and(
        eq(directMessage.id, messageId),
        eq(directMessage.organizationId, organizationId),
        isNull(directMessage.deletedAt),
      ),
    });
    if (!found) throw new NotFoundException("Direct message not found");
    if (found.senderId !== memberId && found.recipientId !== memberId)
      throw new ForbiddenException("This conversation is private");
    return;
  }
  const [found] = await db
    .select({ channelId: message.channelId })
    .from(message)
    .innerJoin(channel, eq(channel.id, message.channelId))
    .where(
      and(
        eq(message.id, messageId),
        eq(channel.organizationId, organizationId),
        isNull(message.deletedAt),
      ),
    )
    .limit(1);
  if (!found) throw new NotFoundException("Channel message not found");
  await requireChannelMembership(
    db,
    found.channelId,
    memberId,
    "Join this channel to access this message",
  );
}
