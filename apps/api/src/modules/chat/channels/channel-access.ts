import { ForbiddenException, NotFoundException } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { channel, channelMember } from "@teamlyf/db";
import { and, eq } from "drizzle-orm";

export type ChannelRow = typeof channel.$inferSelect;
export type ChannelMembershipRow = typeof channelMember.$inferSelect;

export async function requireChannelRow(
  db: Database,
  organizationId: string,
  channelId: string,
): Promise<ChannelRow> {
  const row = await db.query.channel.findFirst({
    where: and(eq(channel.id, channelId), eq(channel.organizationId, organizationId)),
  });
  if (!row) throw new NotFoundException("Channel not found");
  return row;
}

export async function requireChannelMembership(
  db: Database,
  channelId: string,
  memberId: string,
  message = "You must be a member of this channel",
): Promise<ChannelMembershipRow> {
  const row = await db.query.channelMember.findFirst({
    where: and(eq(channelMember.channelId, channelId), eq(channelMember.memberId, memberId)),
  });
  if (!row) throw new ForbiddenException(message);
  return row;
}
