import { useCallback, useEffect, useState } from "react";
import { useCallStore } from "@/lib/store/ui-stores";
import { useCallEvents } from "@/features/chat/data/hooks/use-global-call-events";
import { useCallSounds } from "@/features/chat/data/hooks/use-call-sound-events-hook";
import { getSocket } from "@/lib/socket";
import { JoinCallResponse } from "@/features/chat/types/call/types";
import api from "@/features/chat/data/http";
import { CONFIG } from "@/features/chat/data/config";
import { toast } from "sonner";
import { TenantMember } from "@/features/chat/types/tenant-members/types";

type UseChannelCallParams = {
  channelId: string;
  tenantId: string;
  accessToken: string;
  myMemberId: string | undefined;
  channelMembers: TenantMember[];
};

export function useChannelCall({
  channelId,
  tenantId,
  accessToken,
  myMemberId,
  channelMembers,
}: UseChannelCallParams) {
  const {
    isCallActive: isCallActiveGlobal,
    setActiveCallSessionGlobal,
    setIsCallActiveGlobal,
    setRoomTokenGlobal,
    setCallTypeGlobal,
    triggerCallEndedSignal,
  } = useCallStore();

  const [isConnecting, setIsConnecting] = useState(false);
  const [initiatedCallType, setInitiatedCallType] = useState<"voice" | "video" | "CONFERENCE">(
    "voice",
  );

  const fetchRoomToken = async (callId: string) => {
    try {
      const response = await api.post(CONFIG.API_ENDPOINTS.CALLS.JOIN(tenantId, callId));
      return response.data;
    } catch {
      toast.error("Failed to join the call room");
      return null;
    }
  };

  const {
    activeCallSession,
    isRinging,
    setActiveCallSession,
    acceptedSession,
    clearAcceptedSession,
    callRejected,
    prepareForNewCall,
  } = useCallEvents(channelId);

  useCallSounds(isRinging, isConnecting);

  useEffect(() => {
    if (!acceptedSession) return;
    clearAcceptedSession();
    fetchRoomToken(acceptedSession.callId).then((roomData) => {
      if (roomData) {
        setActiveCallSessionGlobal({ ...roomData.callSession, roomName: roomData.roomName });
        setRoomTokenGlobal(roomData.token);
        setCallTypeGlobal(initiatedCallType || "voice");
        setIsCallActiveGlobal(true);
        setIsConnecting(false);
      } else {
        setIsConnecting(false);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acceptedSession, initiatedCallType]);

  const handleCallRejected = useCallback(() => {
    if (callRejected === 0) return;
    setIsConnecting(false);
    setIsCallActiveGlobal(false);
    setActiveCallSessionGlobal(null);
    setRoomTokenGlobal("");
  }, [callRejected, setIsCallActiveGlobal, setActiveCallSessionGlobal, setRoomTokenGlobal]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    handleCallRejected();
  }, [handleCallRejected]);

  const isCallOngoing = !!activeCallSession && !isRinging && !isCallActiveGlobal;

  const handleJoinOngoingCall = async () => {
    if (!activeCallSession) return;
    const callId = String(activeCallSession.callId || activeCallSession.id || "");
    if (!callId) return;
    const roomData = await fetchRoomToken(callId);
    if (roomData) {
      setActiveCallSessionGlobal({
        ...activeCallSession,
        ...roomData.callSession,
        roomName: roomData.roomName,
      });
      setRoomTokenGlobal(roomData.token);
      setCallTypeGlobal(activeCallSession.callType || "voice");
      setIsCallActiveGlobal(true);
      setIsConnecting(false);
    }
  };

  const handleInitiateCall = (type: "voice" | "video") => {
    if (isConnecting || isCallActiveGlobal) return;

    const recipientIds = channelMembers
      .map((m: TenantMember) => m.id)
      .filter((id: string) => id !== myMemberId);

    if (recipientIds.length === 0) {
      toast.error("No other members in this channel to call.");
      return;
    }

    prepareForNewCall();
    setInitiatedCallType(type);
    const socket = getSocket(accessToken, tenantId);
    setIsConnecting(true);

    socket.emit(
      "initiate-call",
      { recipientIds, callType: type, channelId },
      (res: JoinCallResponse) => {
        if (res.callSession) {
          setActiveCallSession(res.callSession);
        } else {
          setIsConnecting(false);
          alert("Could not establish call.");
        }
      },
    );
  };

  const handleCancelConnecting = () => {
    if (activeCallSession) {
      const socket = getSocket(accessToken, tenantId);
      const sessionId = activeCallSession.callId || activeCallSession.id;
      if (sessionId) socket.emit("end-call", { callId: sessionId });
      triggerCallEndedSignal();
    }
    setIsConnecting(false);
    setActiveCallSession(null);
  };

  return {
    isConnecting,
    activeCallSession,
    isCallOngoing,
    handleJoinOngoingCall,
    handleInitiateCall,
    handleCancelConnecting,
    setActiveCallSession,
  };
}
