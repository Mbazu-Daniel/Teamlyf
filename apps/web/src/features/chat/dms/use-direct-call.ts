import { useEffect, useState } from "react";
import { useCallStore } from "@/lib/store/ui-stores";
import { useCallEvents } from "@/features/chat/data/hooks/use-global-call-events";
import { useCallSounds } from "@/features/chat/data/hooks/use-call-sound-events-hook";
import { getSocket } from "@/lib/socket";
import { JoinCallResponse } from "@/features/chat/types/call/types";
import api from "@/features/chat/data/http";
import { CONFIG } from "@/features/chat/data/config";
import { toast } from "sonner";

type UseDirectCallParams = {
  chatId: string;
  tenantId: string;
  accessToken: string;
};

export function useDirectCall({ chatId, tenantId, accessToken }: UseDirectCallParams) {
  const {
    isCallActive,
    setIsCallActiveGlobal,
    setActiveCallSessionGlobal,
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
    prepareForNewCall,
  } = useCallEvents(chatId, {
    onCallRejected: () => {
      setIsConnecting(false);
      setIsCallActiveGlobal(false);
      setActiveCallSessionGlobal(null);
      setRoomTokenGlobal("");
    },
  });

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

  useCallSounds(isRinging, isConnecting);

  const handleInitiateCall = (type: "voice" | "video") => {
    if (isConnecting || isCallActive) return;
    prepareForNewCall();
    setInitiatedCallType(type);
    const socket = getSocket(accessToken, tenantId);
    setIsConnecting(true);

    socket.emit(
      "initiate-call",
      { recipientId: chatId, callType: type },
      (res: JoinCallResponse) => {
        if (res.callSession) {
          setActiveCallSession(res.callSession);
        } else {
          setIsConnecting(false);
          toast.error("Could not establish call.");
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
    handleInitiateCall,
    handleCancelConnecting,
  };
}
