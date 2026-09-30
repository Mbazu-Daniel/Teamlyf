import type {
  CallParticipantDto,
  CallParticipantRow,
  CallSessionDto,
  CallSessionRow,
} from "./calls.types";

export function toCallSessionDto(row: CallSessionRow, rows: CallParticipantRow[]): CallSessionDto {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    tenantId: row.organizationId,
    roomId: row.roomId,
    roomName: row.roomName,
    callType: row.callType === "video" ? "video" : "voice",
    status: row.status === "ended" ? "ended" : "active",
    settings: (row.settings ?? {}) as Record<string, unknown>,
    isRecording: row.isRecording,
    recordingId: row.recordingId,
    recordingUrl: row.recordingUrl,
    lockedAt: row.lockedAt ? row.lockedAt.toISOString() : null,
    initiatorId: row.initiatorId,
    channelId: row.channelId,
    recipientId: row.recipientId,
    startedAt: (row.startedAt ?? row.createdAt).toISOString(),
    endedAt: row.endedAt ? row.endedAt.toISOString() : null,
    duration: row.duration,
    participants: rows.map(toCallParticipantDto),
  };
}

export function toCallParticipantDto(row: CallParticipantRow): CallParticipantDto {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    callSessionId: row.callSessionId,
    tenantMemberId: row.memberId,
    isGuest: row.isGuest,
    guestName: row.guestName,
    status: row.status === "joined" ? "JOINED" : "LEFT",
    joinedAt: row.joinedAt ? row.joinedAt.toISOString() : null,
    leftAt: row.leftAt ? row.leftAt.toISOString() : null,
    wasPresent: row.wasPresent ? row.wasPresent.toISOString() : null,
    metadata: (row.metadata ?? null) as unknown,
  };
}
