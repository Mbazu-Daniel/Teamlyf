export interface InitiatorSessionData {
  callId: string;
  participantId: string;
  participantPhoto: string | null;
}

export interface RecipientSessionData {
  callId: string;
  callType: "voice" | "video";
  initiatorId: string;
  initiatorPhoto: string | null;
  roomName: string;
  channelId?: string | null;
}

export interface CallParticipant {
  id: string;
  createdAt: string;
  callSessionId: string;
  tenantMemberId: string;
  isGuest: boolean;
  guestName: string | null;
  status: "JOINED" | "LEFT";
  joinedAt: string | null;
  leftAt: string | null;
  wasPresent: string | null;
  metadata: unknown | null;
}

export interface CallSession {
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
  recipientId: string;
  startedAt: string;
  endedAt: string | null;
  duration: number | null;
  participants: CallParticipant[];
}

export interface JoinCallResponse {
  token: string;
  roomName: string;
  callSession: CallSession;
  participantPhoto: string | null;
  success?: boolean;
}

export interface CallHistoryRecord {
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
  recipientId: string;
  participants: CallParticipant[];
  initiator: {
    id: string;
    firstName: string;
    lastName: string;
    preferredName: string | null;
    photoUrl: string | null;
    user: {
      name: string;
      email: string;
    };
  };
  recipient: {
    id: string;
    firstName: string;
    lastName: string;
    preferredName: string | null;
    photoUrl: string | null;
    user: {
      name: string;
      email: string;
    };
  } | null;
  channel: {
    id: string;
    name: string;
  } | null;
}

export interface unifiedCallSession {
  id?: string;
  callId?: string;
  callType?: "voice" | "video";
  initiatorId?: string;
  initiatorPhoto?: string | null;
  roomName?: string;
  channelId?: string | null;
  participantId?: string;
  participantPhoto?: string | null;
  token?: string;
  callSession?: CallSession;
  success?: boolean;
}
