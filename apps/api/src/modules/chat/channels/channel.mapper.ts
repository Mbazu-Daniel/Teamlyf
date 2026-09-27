import type { Database } from "@teamlyf/db";
import { message } from "@teamlyf/db";
import { and, count, eq, gt, isNull, or } from "drizzle-orm";
import type { ChatMemberSource } from "../shared/member.mapper";
import { loadChatMemberSources, toChatParticipant } from "../shared/member.mapper";
import type { ChannelMembershipRow, ChannelRow } from "./channel-access";

/** `createdBy` — the workspace member behind `channel.createdById`. */
export type ChannelCreatorDto = {
  id: string;
  createdAt: string;
  tenantId: string;
  userId: string;
  role: string;
  firstName: string;
  lastName: string;
  updatedAt: string;
};

/** One `Channel` as the ported sidebar reads it: row + the caller's two flags. */
export type ChannelDto = {
  id: string;
  createdAt: string;
  tenantId: string;
  name: string;
  description: string;
  createdById: string;
  updatedAt: string;
  /** The target schema has no soft-delete column, so a channel is never tombstoned. */
  deletedAt: string | null;
  createdBy: ChannelCreatorDto;
  unreadCount: number;
  isMember: boolean;
};

/** `GET /channels/:channelId/members` row — `channel_member` has no surrogate key. */
export type ChannelMemberDto = {
  id: string;
  channelId: string;
  tenantMemberId: string;
  joinedAt: string;
  tenantMember: {
    id: string;
    firstName: string;
    lastName: string;
    user: { image: string | null };
  };
};

/** The `channel_member` row itself — what `POST :channelId/join` mirrors back. */
export type ChannelMembershipDto = {
  id: string;
  channelId: string;
  tenantMemberId: string;
  joinedAt: string;
  lastReadAt: string | null;
  role: string;
  isMuted: boolean;
  mutedUntil: string | null;
};

export type ToChannelDtoArgs = {
  row: ChannelRow;
  creator: ChatMemberSource | null;
  unreadCount: number;
  isMember: boolean;
};

function toChannelCreator(creator: ChatMemberSource | null, row: ChannelRow): ChannelCreatorDto {
  if (!creator) {
    return {
      id: row.createdById ?? "",
      createdAt: row.createdAt.toISOString(),
      tenantId: row.organizationId,
      userId: "",
      role: "member",
      firstName: "",
      lastName: "",
      updatedAt: row.updatedAt.toISOString(),
    };
  }
  const { firstName, lastName } = toChatParticipant(creator);
  return {
    id: creator.member.id,
    createdAt: creator.member.createdAt.toISOString(),
    tenantId: creator.member.organizationId,
    userId: creator.member.userId,
    role: creator.member.role,
    firstName,
    lastName,
    updatedAt: creator.member.updatedAt.toISOString(),
  };
}

export function toChannelDto({ row, creator, unreadCount, isMember }: ToChannelDtoArgs): ChannelDto {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    tenantId: row.organizationId,
    name: row.name,
    description: row.description ?? "",
    createdById: row.createdById ?? "",
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: null,
    createdBy: toChannelCreator(creator, row),
    unreadCount,
    isMember,
  };
}

export function toChannelMemberDto(row: ChannelMembershipRow, source: ChatMemberSource): ChannelMemberDto {
  const { firstName, lastName } = toChatParticipant(source);
  return {
    id: row.memberId,
    channelId: row.channelId,
    tenantMemberId: row.memberId,
    joinedAt: row.joinedAt.toISOString(),
    tenantMember: {
      id: source.member.id,
      firstName,
      lastName,
      user: { image: source.user?.image ?? null },
    },
  };
}

export function toChannelMembershipDto(row: ChannelMembershipRow): ChannelMembershipDto {
  return {
    id: row.memberId,
    channelId: row.channelId,
    tenantMemberId: row.memberId,
    joinedAt: row.joinedAt.toISOString(),
    lastReadAt: row.lastReadAt ? row.lastReadAt.toISOString() : null,
    role: row.role,
    isMuted: row.isMuted,
    mutedUntil: row.mutedUntil ? row.mutedUntil.toISOString() : null,
  };
}

/** One lookup serves a whole channel list: creators keyed by member id. */
export async function loadChannelCreators(
  db: Database,
  organizationId: string,
  rows: ChannelRow[],
): Promise<Map<string, ChatMemberSource>> {
  const ids = [...new Set(rows.map((row) => row.createdById).filter((id): id is string => id !== null))];
  if (ids.length === 0) return new Map();
  const sources = await loadChatMemberSources(db, organizationId, { memberIds: ids });
  return new Map(sources.map((source) => [source.member.id, source]));
}

/**
 * Unread = messages posted after the caller's `channel_member.lastReadAt`, or
 * every message when they have never opened the channel. One grouped query
 * answers every channel on the list; memberships the caller does not hold are
 * simply absent from the result.
 */
export async function loadUnreadCounts(
  db: Database,
  memberships: ChannelMembershipRow[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (memberships.length === 0) return counts;

  const unreadSince = memberships.map((row) =>
    row.lastReadAt
      ? and(eq(message.channelId, row.channelId), gt(message.createdAt, row.lastReadAt))
      : eq(message.channelId, row.channelId),
  );

  const rows = await db
    .select({ channelId: message.channelId, unread: count() })
    .from(message)
    .where(and(isNull(message.deletedAt), or(...unreadSince)))
    .groupBy(message.channelId);

  for (const row of rows) counts.set(row.channelId, Number(row.unread));
  for (const membership of memberships) {
    if (!counts.has(membership.channelId)) counts.set(membership.channelId, 0);
  }
  return counts;
}
