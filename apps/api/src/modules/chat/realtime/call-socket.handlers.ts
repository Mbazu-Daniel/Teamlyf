import type { Database } from "@teamlyf/db";
import { member } from "@teamlyf/db";
import { and, eq } from "drizzle-orm";
import type { CallsService } from "../../calls/calls.service";
import { CHAT_ROOMS } from "../shared/rooms";
import {
  errorMessage,
  validIds,
  type CallIdPayload,
  type InitiateCallPayload,
} from "./socket-payloads";
import type { AuthenticatedSocket } from "./ws-auth";
import { broadcastChannel } from "./channel-broadcast";

export type CallSocketDeps = {
  calls: CallsService;
  db: Database;
};

function callRoom(callId: string): string {
  return `call:${callId}`;
}

export async function initiateCall(
  client: AuthenticatedSocket,
  data: InitiateCallPayload,
  deps: CallSocketDeps,
): Promise<unknown> {
  try {
    const { organizationId, memberId } = client.data;
    const session = await deps.calls.initiate({
      organizationId,
      initiatorId: memberId,
      callType: data?.callType,
      channelId: typeof data?.channelId === "string" ? data.channelId : undefined,
      recipientId: typeof data?.recipientId === "string" ? data.recipientId : undefined,
      participantIds: [
        ...(validIds(data?.participantIds) ?? []),
        ...(validIds(data?.recipientIds) ?? []),
      ],
    });

    const initiatorPhoto = await loadPhoto(deps.db, organizationId, memberId);
    const payload = {
      callId: session.id,
      callType: session.callType,
      initiatorId: memberId,
      initiatorPhoto,
      roomName: session.roomName,
      channelId: session.channelId,
    };

    const invited = [...new Set(session.participants.map((part) => part.tenantMemberId))].filter(
      (id): id is string => Boolean(id) && id !== memberId,
    );
    for (const id of invited) {
      client.nsp.to(CHAT_ROOMS.member(id)).emit("call-initiated", payload);
    }
    if (session.channelId) {
      await broadcastChannel(deps.db, client, session.channelId, "call-initiated", payload, true);
    }

    await client.join(callRoom(session.id));
    return { success: true, callSession: session };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}

export async function acceptCall(
  client: AuthenticatedSocket,
  data: CallIdPayload,
  deps: CallSocketDeps,
): Promise<unknown> {
  try {
    const callId = typeof data?.callId === "string" ? data.callId : "";
    if (!callId) return { success: false, error: "callId is required" };
    const { organizationId, memberId } = client.data;

    const result = await deps.calls.join(callId, organizationId, memberId);
    await client.join(callRoom(callId));

    const payload = {
      callId,
      participantId: memberId,
      participantPhoto: result.participantPhoto,
      participantName: result.participantName,
    };
    client.nsp.to(callRoom(callId)).emit("call-accepted", payload);
    const initiatorId = result.callSession.initiatorId;
    if (initiatorId && initiatorId !== memberId) {
      client.nsp.to(CHAT_ROOMS.member(initiatorId)).emit("call-accepted", payload);
    }
    client.nsp.to(CHAT_ROOMS.member(memberId)).emit("call-accepted", payload);

    return {
      success: true,
      token: result.token,
      roomName: result.roomName,
      callSession: result.callSession,
      participantPhoto: result.participantPhoto,
      participantName: result.participantName,
    };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}

export async function rejectCall(
  client: AuthenticatedSocket,
  data: CallIdPayload,
  deps: CallSocketDeps,
): Promise<unknown> {
  try {
    const callId = typeof data?.callId === "string" ? data.callId : "";
    if (!callId) return { success: false, error: "callId is required" };
    const { organizationId, memberId } = client.data;

    const session = await deps.calls.reject(callId, organizationId, memberId);
    const payload = { callId, participantId: memberId, reason: data?.reason ?? null };
    client.nsp.to(callRoom(callId)).emit("call-rejected", payload);
    if (session.initiatorId && session.initiatorId !== memberId) {
      client.nsp.to(CHAT_ROOMS.member(session.initiatorId)).emit("call-rejected", payload);
    }
    client.nsp.to(CHAT_ROOMS.member(memberId)).emit("call-rejected", payload);
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}

export async function endCall(
  client: AuthenticatedSocket,
  data: CallIdPayload,
  deps: CallSocketDeps,
): Promise<unknown> {
  try {
    const callId = typeof data?.callId === "string" ? data.callId : "";
    if (!callId) return { success: false, error: "callId is required" };
    const { organizationId, memberId } = client.data;

    const session = await deps.calls.end(callId, organizationId, memberId);
    const room = callRoom(callId);
    client.nsp
      .to(room)
      .emit("call-ended", { callId, endedBy: memberId, duration: session.duration });
    client.nsp.socketsLeave(room);
    return { success: true, callSession: session };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}

async function loadPhoto(
  db: Database,
  organizationId: string,
  memberId: string,
): Promise<string | null> {
  const row = await db.query.member.findFirst({
    where: and(eq(member.organizationId, organizationId), eq(member.id, memberId)),
    columns: { avatar: true },
  });
  return row?.avatar ?? null;
}
