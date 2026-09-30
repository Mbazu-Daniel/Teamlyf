import type { callParticipant, callSession } from "@teamlyf/db";

export type CallSessionRow = typeof callSession.$inferSelect;
export type CallParticipantRow = typeof callParticipant.$inferSelect;

export type InitiateCallArgs = {
  organizationId: string;
  initiatorId: string;
  callType?: string;
  channelId?: string;
  recipientId?: string;

  participantIds?: string[];
};

export type CallParticipantDto = {
  id: string;
  createdAt: string;
  callSessionId: string;
  tenantMemberId: string | null;
  isGuest: boolean;
  guestName: string | null;
  status: "JOINED" | "LEFT";
  joinedAt: string | null;
  leftAt: string | null;
  wasPresent: string | null;
  metadata: unknown | null;
};

export type CallMemberSummary = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  preferredName: string | null;
  photoUrl: string | null;
  user: { name: string; email: string };
};

export type CallSessionDto = {
  id: string;
  createdAt: string;
  tenantId: string;
  roomId: string | null;
  roomName: string;
  callType: "voice" | "video";
  status: "active" | "ended";
  settings: Record<string, unknown>;
  isRecording: boolean;
  recordingId: string | null;
  recordingUrl: string | null;
  lockedAt: string | null;
  initiatorId: string;
  channelId: string | null;
  recipientId: string | null;
  startedAt: string;
  endedAt: string | null;
  duration: number | null;
  participants: CallParticipantDto[];
};

export type CallHistoryRecord = {
  id: string;
  createdAt: string;
  tenantId: string;
  roomName: string;
  callType: "voice" | "video";
  status: "active" | "ended";
  startedAt: string;
  endedAt: string | null;
  duration: number | null;
  initiatorId: string;
  recipientId: string | null;
  participants: CallParticipantDto[];
  initiator: CallMemberSummary;
  recipient: CallMemberSummary | null;
  channel: { id: string; name: string } | null;
};

export type JoinCallResult = {
  success: true;
  token: string;
  roomName: string;
  callSession: CallSessionDto;
  participantPhoto: string | null;
  participantName: string;
};
