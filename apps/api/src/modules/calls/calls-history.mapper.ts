import type { Database } from "@teamlyf/db";
import { callParticipant, callSession, channel, member, user } from "@teamlyf/db";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { toCallParticipantDto } from "./call.mapper";
import type {
  CallHistoryRecord,
  CallMemberSummary,
  CallParticipantRow,
  CallSessionRow,
} from "./calls.types";

const HISTORY_LIMIT = 50;

type UserRow = typeof user.$inferSelect;

async function loadMySessions(
  db: Database,
  organizationId: string,
  memberId: string,
): Promise<CallSessionRow[]> {
  const myParts = await db.query.callParticipant.findMany({
    where: eq(callParticipant.memberId, memberId),
    columns: { callSessionId: true },
  });
  const participantSessionIds = [...new Set(myParts.map((row) => row.callSessionId))];
  const conditions = [eq(callSession.initiatorId, memberId), eq(callSession.recipientId, memberId)];
  if (participantSessionIds.length > 0)
    conditions.push(inArray(callSession.id, participantSessionIds));
  return db.query.callSession.findMany({
    where: and(eq(callSession.organizationId, organizationId), or(...conditions)),
    orderBy: [desc(callSession.createdAt)],
    limit: HISTORY_LIMIT,
  });
}

export async function loadParticipants(
  db: Database,
  sessionIds: string[],
): Promise<Map<string, CallParticipantRow[]>> {
  const grouped = new Map<string, CallParticipantRow[]>();
  if (sessionIds.length === 0) return grouped;
  const rows = await db.query.callParticipant.findMany({
    where: inArray(callParticipant.callSessionId, sessionIds),
  });
  for (const row of rows) {
    const list = grouped.get(row.callSessionId) ?? [];
    list.push(row);
    grouped.set(row.callSessionId, list);
  }
  return grouped;
}

export async function loadMemberSummaries(
  db: Database,
  organizationId: string,
  memberIds: string[],
): Promise<Map<string, CallMemberSummary>> {
  const summaries = new Map<string, CallMemberSummary>();
  const unique = [...new Set(memberIds.filter(Boolean))];
  if (unique.length === 0) return summaries;
  const members = await db.query.member.findMany({
    where: and(eq(member.organizationId, organizationId), inArray(member.id, unique)),
  });
  const userIds = [
    ...new Set(members.map((row) => row.userId).filter((id): id is string => Boolean(id))),
  ];
  const usersById = new Map<string, UserRow>();
  if (userIds.length > 0) {
    const users = await db.query.user.findMany({ where: inArray(user.id, userIds) });
    for (const row of users) usersById.set(row.id, row);
  }
  for (const row of members) {
    const userRow = row.userId ? usersById.get(row.userId) : undefined;
    summaries.set(row.id, {
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      preferredName: null,
      photoUrl: row.avatar ?? null,
      user: {
        name: userRow?.name ?? "",
        email: userRow?.email ?? "",
      },
    });
  }
  return summaries;
}

async function mapHistory(
  db: Database,
  organizationId: string,
  sessions: CallSessionRow[],
): Promise<CallHistoryRecord[]> {
  const participants = await loadParticipants(
    db,
    sessions.map((session) => session.id),
  );
  return mapSessions(db, organizationId, sessions, participants);
}

async function mapSessions(
  db: Database,
  organizationId: string,
  sessions: CallSessionRow[],
  participants: Map<string, CallParticipantRow[]>,
): Promise<CallHistoryRecord[]> {
  const memberIds = [
    ...new Set(
      sessions.flatMap((session) => [
        session.initiatorId,
        ...(session.recipientId ? [session.recipientId] : []),
        ...(participants.get(session.id) ?? [])
          .map((row) => row.memberId)
          .filter((id): id is string => Boolean(id)),
      ]),
    ),
  ];
  const summaries = await loadMemberSummaries(db, organizationId, memberIds);

  const channelIds = [
    ...new Set(
      sessions.map((session) => session.channelId).filter((id): id is string => Boolean(id)),
    ),
  ];
  const channels = new Map<string, string>();
  if (channelIds.length > 0) {
    const rows = await db.query.channel.findMany({ where: inArray(channel.id, channelIds) });
    for (const row of rows) channels.set(row.id, row.name);
  }

  return sessions.map((session) => ({
    id: session.id,
    createdAt: session.createdAt.toISOString(),
    tenantId: session.organizationId,
    roomName: session.roomName,
    callType: session.callType === "video" ? "video" : "voice",
    status: session.status === "ended" ? "ended" : "active",
    startedAt: (session.startedAt ?? session.createdAt).toISOString(),
    endedAt: session.endedAt ? session.endedAt.toISOString() : null,
    duration: session.duration,
    initiatorId: session.initiatorId,
    recipientId: session.recipientId,
    participants: (participants.get(session.id) ?? []).map(toCallParticipantDto),
    initiator: summaries.get(session.initiatorId) ?? fallbackSummary(session.initiatorId),
    recipient: session.recipientId
      ? (summaries.get(session.recipientId) ?? fallbackSummary(session.recipientId))
      : null,
    channel: session.channelId
      ? { id: session.channelId, name: channels.get(session.channelId) ?? "Channel" }
      : null,
  }));
}

function fallbackSummary(id: string): CallMemberSummary {
  return {
    id,
    firstName: null,
    lastName: null,
    preferredName: null,
    photoUrl: null,
    user: { name: "", email: "" },
  };
}

export async function getCallHistory(
  db: Database,
  organizationId: string,
  memberId: string,
): Promise<CallHistoryRecord[]> {
  const sessions = await loadMySessions(db, organizationId, memberId);
  return mapHistory(db, organizationId, sessions);
}

export async function loadMissedCalls(
  db: Database,
  organizationId: string,
  memberId: string,
): Promise<CallHistoryRecord[]> {
  const sessions = await loadMySessions(db, organizationId, memberId);
  const participants = await loadParticipants(
    db,
    sessions.map((session) => session.id),
  );
  const mine = new Set(
    [...participants.values()]
      .flat()
      .filter((row) => row.memberId === memberId)
      .map((row) => row.callSessionId),
  );
  const missed = sessions.filter((session) => {
    if (session.status !== "ended" || session.initiatorId === memberId) return false;
    const rows = (participants.get(session.id) ?? []).filter((row) => row.memberId === memberId);
    if (rows.some((row) => row.status === "joined")) return false;
    return session.recipientId === memberId || mine.has(session.id);
  });
  return mapSessions(db, organizationId, missed, participants);
}
