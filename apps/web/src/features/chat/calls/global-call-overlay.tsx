import React, { useEffect } from "react";
import { useCallStore } from "@/lib/store/ui-stores";
import { useTenantStore } from "@/lib/store/tenant-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { useGlobalCallEvents } from "@/features/chat/data/hooks/use-global-call-events";
import { useCallSounds } from "@/features/chat/data/hooks/use-call-sound-events-hook";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getSocket } from "@/lib/socket";
import { JoinCallResponse } from "@/features/chat/types/call/types";
const CallRoom = React.lazy(() =>
  import("./call-interface").then((mod) => ({ default: mod.CallRoom })),
);
import api from "@/features/chat/data/http";
import { CONFIG } from "@/features/chat/data/config";
import { toast } from "sonner";
import { useFetchTenantMembers } from "@/features/chat/data/queries/use-fetch-tenant-members-hook";
import { TenantMember } from "@/features/chat/types/tenant-members/types";
import { useGetChannels } from "@/features/chat/data/queries/channels/use-fetch-channels-hook";
import { Channel } from "@/features/chat/types/channel/types";
import { IconLoader } from "@tabler/icons-react";

export function GlobalCallOverlay() {
  const tenantId = useTenantStore((s) => s.tenantId);
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  const {
    isRinging: isRingingGlobal,
    activeCallSession: activeCallSessionGlobal,
    isCallActive: isCallActiveGlobal,
    roomToken: roomTokenGlobal,
    callType: callTypeGlobal,
    setIsRinging,
    setActiveCallSessionGlobal,
    setIsCallActiveGlobal,
    setRoomTokenGlobal,
    setCallTypeGlobal,
    triggerCallEndedSignal,
  } = useCallStore();

  const { data: members } = useFetchTenantMembers(tenantId!);
  const { data: channels = [] } = useGetChannels(tenantId!);
  const myMemberId = members?.records?.find(
    (m: TenantMember) => String(m.userId) === String(user?.id),
  )?.id;

  const [isAccepting, setIsAccepting] = React.useState(false);

  const {
    activeCallSession,
    isRinging,
    setIsRinging: setLocalRinging,
    setActiveCallSession: setLocalActiveSession,
    acceptedSession,
    clearAcceptedSession,
    callRejected,
  } = useGlobalCallEvents();

  useEffect(() => {
    if (isRinging) {
      setIsRinging(true);
    }
    if (activeCallSession) {
      setActiveCallSessionGlobal(activeCallSession);
    }
  }, [isRinging, activeCallSession, setIsRinging, setActiveCallSessionGlobal]);

  useCallSounds(isRingingGlobal, false);

  useEffect(() => {
    if (callRejected > 0) {
      setIsCallActiveGlobal(false);
      setIsRinging(false);
      setActiveCallSessionGlobal(null);
    }
  }, [callRejected, setIsCallActiveGlobal, setIsRinging, setActiveCallSessionGlobal]);

  const fetchRoomToken = React.useCallback(
    async (callId: string) => {
      try {
        const response = await api.post(CONFIG.API_ENDPOINTS.CALLS.JOIN(tenantId!, callId));
        return response.data;
      } catch {
        toast.error("Failed to join the call room");
        return null;
      }
    },
    [tenantId],
  );

  useEffect(() => {
    if (!acceptedSession) return;
    const callId = acceptedSession.callId;
    clearAcceptedSession();

    fetchRoomToken(callId).then((roomData) => {
      if (roomData) {
        setActiveCallSessionGlobal({ ...roomData.callSession, roomName: roomData.roomName });
        setRoomTokenGlobal(roomData.token);
        setCallTypeGlobal(callTypeGlobal || "voice");
        setIsCallActiveGlobal(true);
        setIsRinging(false);
      }
    });
  }, [
    acceptedSession,
    clearAcceptedSession,
    callTypeGlobal,
    tenantId,
    fetchRoomToken,
    setActiveCallSessionGlobal,
    setRoomTokenGlobal,
    setCallTypeGlobal,
    setIsCallActiveGlobal,
    setIsRinging,
  ]);

  const handleAcceptCall = () => {
    const session = activeCallSessionGlobal;
    if (!session) return;

    const callId = session.callId || session.id;
    if (!callId) {
      toast.error("Call ID missing");
      return;
    }

    const socket = getSocket(accessToken!, tenantId!);
    setIsAccepting(true);
    socket.emit("accept-call", { callId }, async (res: JoinCallResponse) => {
      if (res.success && res.callSession) {
        const roomData = await fetchRoomToken(callId);
        if (roomData) {
          setRoomTokenGlobal(roomData.token);
          setCallTypeGlobal(session.callType || "voice");
          setIsRinging(false);
          setIsCallActiveGlobal(true);

          setLocalRinging(false);
        }
      }
      setIsAccepting(false);
    });
  };

  const handleDeclineCall = () => {
    if (!activeCallSessionGlobal) return;
    const socket = getSocket(accessToken!, tenantId!);
    socket.emit("reject-call", { callId: activeCallSessionGlobal.callId });
    setIsRinging(false);
    setLocalRinging(false);
  };

  if (!isRingingGlobal && !isCallActiveGlobal) return null;

  const callerMember = members?.records?.find(
    (m: TenantMember) => m.id === activeCallSessionGlobal?.initiatorId,
  );
  const channel = channels.find((c: Channel) => c.id === activeCallSessionGlobal?.channelId);

  const displayTitle = activeCallSessionGlobal?.channelId
    ? channel?.name || "Channel Call"
    : callerMember
      ? `${callerMember.firstName} ${callerMember.lastName}`
      : "Incoming Call...";

  const displayAvatar = activeCallSessionGlobal?.channelId
    ? channel?.avatar || ""
    : activeCallSessionGlobal?.initiatorPhoto || callerMember?.avatar || "";

  const displayInitial = activeCallSessionGlobal?.channelId
    ? channel?.name
      ? channel.name[0].toUpperCase()
      : "#"
    : callerMember?.firstName
      ? callerMember.firstName[0].toUpperCase()
      : "?";

  return (
    <>
      {/* incoming Call Ringing UI */}
      {isRingingGlobal && activeCallSessionGlobal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-80 bg-card border shadow-2xl p-6 rounded-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                Incoming {activeCallSessionGlobal.callType || "call"}
              </p>
              <p className="font-bold text-xl truncate max-w-full">{displayTitle}</p>
            </div>

            <Avatar elevation="lg" className="h-20 w-20">
              <AvatarImage src={displayAvatar} />
              <AvatarFallback size="2xl" weight="bold" bg="blue-100">
                {displayInitial}
              </AvatarFallback>
            </Avatar>

            <div className="flex gap-4 w-full mt-2">
              <button
                onClick={handleDeclineCall}
                disabled={isAccepting}
                className="flex-1 py-3 bg-destructive hover:bg-destructive/90 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
              >
                Decline
              </button>
              <button
                onClick={handleAcceptCall}
                disabled={isAccepting}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAccepting && <IconLoader className="h-5 w-5 animate-spin" />}
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Call Room UI */}
      {isCallActiveGlobal && activeCallSessionGlobal && (
        <div className="fixed inset-0 z-[1001] bg-background">
          <CallRoom
            token={roomTokenGlobal}
            roomName={activeCallSessionGlobal.roomName || ""}
            callType={callTypeGlobal}
            onLeave={() => {
              setIsCallActiveGlobal(false);
              setActiveCallSessionGlobal(null);
              setRoomTokenGlobal("");
              setLocalActiveSession(null);
            }}
            onEnd={() => {
              const socket = getSocket(accessToken!, tenantId!);
              const sessionId = activeCallSessionGlobal.callId || activeCallSessionGlobal.id;
              if (sessionId) socket.emit("end-call", { callId: sessionId });

              triggerCallEndedSignal();

              setIsCallActiveGlobal(false);
              setActiveCallSessionGlobal(null);
              setRoomTokenGlobal("");
              setLocalActiveSession(null);
            }}
            isInitiator={activeCallSessionGlobal.initiatorId === myMemberId}
          />
        </div>
      )}
    </>
  );
}
