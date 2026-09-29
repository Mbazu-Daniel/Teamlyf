import type { Database } from "@teamlyf/db";
import { member, user } from "@teamlyf/db";
import { and, eq, inArray } from "drizzle-orm";
import { CHAT_ROOMS } from "../shared/rooms";
import type { TypingPayload } from "./socket-payloads";
import type { ChatTypingService } from "./typing.service";
import type { AuthenticatedSocket } from "./ws-auth";
import { ForbiddenException } from "@nestjs/common";
import { requireChannelMembership, requireChannelRow } from "../channels/channel-access";
import { broadcastChannel } from "./channel-broadcast";

export async function requireTypingTarget(db: Database, client: AuthenticatedSocket, data: TypingPayload) {
  if (data.recipientId) {
    const target = await db.query.member.findFirst({ where: and(eq(member.id, data.recipientId), eq(member.organizationId, client.data.organizationId)) });
    if (!target) throw new ForbiddenException("Recipient is not in this workspace");
  } else if (data.channelId) {
    await requireChannelRow(db, client.data.organizationId, data.channelId);
    await requireChannelMembership(db, data.channelId, client.data.memberId, "Join this channel before typing");
  }
}

/**
 * Dependencies the typing helpers need — passed in by the gateway so these
 * stay plain functions instead of a second injectable.
 */
export type TypingSocketDeps = {
  typing: ChatTypingService;
  db: Database;
};

export function typingRoom(data: TypingPayload | undefined): string | null {
  const channelId = typeof data?.channelId === "string" && data.channelId ? data.channelId : undefined;
  const recipientId = typeof data?.recipientId === "string" && data.recipientId ? data.recipientId : undefined;
  if (recipientId) return CHAT_ROOMS.member(recipientId);
  if (channelId) return CHAT_ROOMS.channel(channelId);
  return null;
}

export async function stopTypingBroadcast(
  client: AuthenticatedSocket,
  room: string,
  deps: TypingSocketDeps,
): Promise<void> {
  deps.typing.stop(room, client.data.memberId);
  await emitTypingUsers(client, room, deps);
}

export async function emitTypingUsers(
  client: AuthenticatedSocket,
  room: string,
  deps: TypingSocketDeps,
): Promise<void> {
  const channelId = room.startsWith("channel:") ? room.slice("channel:".length) : undefined;
  const recipientId = room.startsWith("member:") ? room.slice("member:".length) : undefined;
  const ids = deps.typing.activeMemberIds(room);
  const users = ids.length ? await loadTypingUsers(deps.db, client.data.organizationId, ids) : [];
  const payload = { typingUsers: users, channelId, recipientId };
  if (channelId) await broadcastChannel(deps.db, client, channelId, "user-typing", payload, true);
  else client.nsp.to(room).emit("user-typing", payload);
}

async function loadTypingUsers(db: Database, organizationId: string, memberIds: string[]) {
  const members = await db.query.member.findMany({
    where: and(eq(member.organizationId, organizationId), inArray(member.id, memberIds)),
  });
  const userIds = [...new Set(members.map((row) => row.userId).filter((id): id is string => Boolean(id)))];
  const usersById = new Map<string, string | null>();
  if (userIds.length > 0) {
    const users = await db.query.user.findMany({ where: inArray(user.id, userIds) });
    for (const row of users) usersById.set(row.id, row.image ?? null);
  }
  return members.map((row) => {
    const name = `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim();
    return {
      id: row.id,
      name,
      firstName: row.firstName ?? undefined,
      lastName: row.lastName ?? undefined,
      avatar: row.userId ? (usersById.get(row.userId) ?? null) : null,
    };
  });
}
