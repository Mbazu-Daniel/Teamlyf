import { getSocket } from "@/lib/socket";
import {
  InitiatorSessionData,
  RecipientSessionData,
  unifiedCallSession,
} from "@/features/chat/types/call/types";
import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useCallStore } from "@/lib/store/ui-stores";

interface GlobalCallEventsContextType {
  activeCallSession: unifiedCallSession | null;
  setActiveCallSession: (session: unifiedCallSession | null) => void;
  isRinging: boolean;
  setIsRinging: (ringing: boolean) => void;
  acceptedSession: InitiatorSessionData | null;
  clearAcceptedSession: () => void;
  callRejected: number;
  prepareForNewCall: () => void;
}

const GlobalCallEventsContext =
  createContext<GlobalCallEventsContextType | null>(null);

export function GlobalCallEventsProvider({
  children,
  tenantId,
  myMemberId,
}: {
  children: React.ReactNode;
  tenantId: string;
  myMemberId: string;
}) {
  const [activeCallSession, setActiveCallSession] =
    useState<unifiedCallSession | null>(null);
  const [isRinging, setIsRinging] = useState(false);
  const [acceptedSession, setAcceptedSession] =
    useState<InitiatorSessionData | null>(null);
  const [callRejected, setCallRejected] = useState(0);

  const activeCallSessionRef = useRef<unifiedCallSession | null>(null);
  const hasAcceptedRef = useRef(false);

  const hasCallEndedSignal = useCallStore((s) => s.hasCallEndedSignal);

  useLayoutEffect(() => {
    if (hasCallEndedSignal > 0) {
      hasAcceptedRef.current = false;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveCallSession(null);
      setIsRinging(false);
    }
  }, [hasCallEndedSignal]);

  useLayoutEffect(() => {
    activeCallSessionRef.current = activeCallSession;
  });

  useEffect(() => {
    if (!tenantId || !myMemberId) return;

    const socket = getSocket(null, tenantId);

    const handleCallInitiated = (data: RecipientSessionData) => {
      const session = data;
      if (!session) return;

      // DO NOT show ringing UI for the initiator themselves
      if (session.initiatorId === myMemberId) return;

      // Always handle in global context (no chatId filtering)
      hasAcceptedRef.current = false;
      setActiveCallSession(session);
      setIsRinging(true);
    };

    const handleCallAccepted = (data: InitiatorSessionData) => {
      const session = data;

      const currentSession = activeCallSessionRef.current;
      const currentId = currentSession?.callId ?? currentSession?.id;
      const incomingId = session?.callId;

      if (incomingId !== currentId) return;

      setIsRinging(false);
      const isInitiator = currentSession?.initiatorId === myMemberId;
      if (!isInitiator) return;

      if (hasAcceptedRef.current) return;
      hasAcceptedRef.current = true;

      setAcceptedSession(session);
    };

    const handleCallEnded = () => {
      hasAcceptedRef.current = false;
      setActiveCallSession(null);
      setIsRinging(false);
      setCallRejected((n) => n + 1);
    };

    const handleCallRejected = () => {
      const currentSession = activeCallSessionRef.current;
      if (!currentSession) return;

      const isChannelCall = !!currentSession.channelId;

      if (isChannelCall) {
        setIsRinging(false);
        return;
      }

      handleCallEnded();
    };

    socket.on("call-initiated", handleCallInitiated);
    socket.on("call-accepted", handleCallAccepted);
    socket.on("call-rejected", handleCallRejected);
    socket.on("call-ended", handleCallEnded);

    return () => {
      socket.off("call-initiated", handleCallInitiated);
      socket.off("call-accepted", handleCallAccepted);
      socket.off("call-rejected", handleCallRejected);
      socket.off("call-ended", handleCallEnded);
    };
  }, [tenantId, myMemberId]);

  const prepareForNewCall = () => {
    hasAcceptedRef.current = false;
    setAcceptedSession(null);
  };

  const value: GlobalCallEventsContextType = {
    activeCallSession,
    setActiveCallSession,
    isRinging,
    setIsRinging,
    acceptedSession,
    clearAcceptedSession: () => setAcceptedSession(null),
    callRejected,
    prepareForNewCall,
  };

  return (
    <GlobalCallEventsContext.Provider value={value}>
      {children}
    </GlobalCallEventsContext.Provider>
  );
}

export function useGlobalCallEvents() {
  const context = useContext(GlobalCallEventsContext);
  if (!context) {
    throw new Error(
      "useGlobalCallEvents must be used within GlobalCallEventsProvider",
    );
  }
  return context;
}

// Hook for components that need filtered call events based on chatId
export function useCallEvents(
  chatId: string,
  props?: {
    onCallRejected?: () => void;
    onCallAccepted?: (session: InitiatorSessionData) => void;
  },
) {
  const global = useGlobalCallEvents();
  const { onCallRejected, onCallAccepted } = props || {};

  const [localRejected, setLocalRejected] = useState(0);
  const [localAccepted, setLocalAccepted] =
    useState<InitiatorSessionData | null>(null);

  useLayoutEffect(() => {
    if (global.callRejected > localRejected) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalRejected(global.callRejected);
      onCallRejected?.();
    }
  }, [global.callRejected, localRejected, onCallRejected]);

  useLayoutEffect(() => {
    if (global.acceptedSession && global.acceptedSession !== localAccepted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalAccepted(global.acceptedSession);
      onCallAccepted?.(global.acceptedSession);
    }
  }, [global.acceptedSession, localAccepted, onCallAccepted]);

  // Filter activeCallSession and isRinging based on chatId
  const isRelevantCall =
    !chatId ||
    global.activeCallSession?.initiatorId === chatId ||
    global.activeCallSession?.channelId === chatId;

  return {
    activeCallSession: isRelevantCall ? global.activeCallSession : null,
    setActiveCallSession: global.setActiveCallSession,
    isRinging: isRelevantCall ? global.isRinging : false,
    setIsRinging: global.setIsRinging,
    acceptedSession: global.acceptedSession,
    clearAcceptedSession: global.clearAcceptedSession,
    callRejected: global.callRejected,
    prepareForNewCall: global.prepareForNewCall,
  };
}
