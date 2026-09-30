import type { Database } from "@teamlyf/db";
import { channelMember, member } from "@teamlyf/db";
import { and, eq } from "drizzle-orm";
import { CHAT_ROOMS } from "../shared/rooms";
import type { AuthenticatedSocket } from "./ws-auth";

export async function broadcastChannel(
  db: Database,
  client: AuthenticatedSocket,
  channelId: string,
  event: string,
  payload: unknown,
  includeSender = false,
) {
  const rows = await db
    .select({ id: member.id })
    .from(channelMember)
    .innerJoin(member, eq(member.id, channelMember.memberId))
    .where(
      and(
        eq(channelMember.channelId, channelId),
        eq(member.organizationId, client.data.organizationId),
      ),
    );
  const rooms = rows.map((row) => CHAT_ROOMS.member(row.id));
  if (rooms.length) (includeSender ? client.nsp : client.broadcast).to(rooms).emit(event, payload);
}
