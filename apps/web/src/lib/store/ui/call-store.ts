import { createStore as create } from "@/lib/create-store";
import { unifiedCallSession } from "@/features/chat/types/call/types";

interface CallState {
  isRinging: boolean;
  activeCallSession: unifiedCallSession | null;
  isCallActive: boolean;
  roomToken: string;
  callType: "voice" | "video" | "CONFERENCE";
  hasCallEndedSignal: number;

  setIsRinging: (isRinging: boolean) => void;
  setActiveCallSessionGlobal: (session: unifiedCallSession | null) => void;
  setIsCallActiveGlobal: (isCallActive: boolean) => void;
  setRoomTokenGlobal: (roomToken: string) => void;
  setCallTypeGlobal: (callType: "voice" | "video" | "CONFERENCE") => void;
  triggerCallEndedSignal: () => void;
  resetCall: () => void;
}

export const useCallStore = create<CallState>()((set) => ({
  isRinging: false,
  activeCallSession: null,
  isCallActive: false,
  roomToken: "",
  callType: "voice",
  hasCallEndedSignal: 0,

  setIsRinging: (isRinging) => set({ isRinging }),
  setActiveCallSessionGlobal: (activeCallSession) => set({ activeCallSession }),
  setIsCallActiveGlobal: (isCallActive) => set({ isCallActive }),
  setRoomTokenGlobal: (roomToken) => set({ roomToken }),
  setCallTypeGlobal: (callType) => set({ callType }),
  triggerCallEndedSignal: () =>
    set((state) => ({ hasCallEndedSignal: state.hasCallEndedSignal + 1 })),
  resetCall: () =>
    set({
      isRinging: false,
      activeCallSession: null,
      isCallActive: false,
      roomToken: "",
      callType: "voice",
      hasCallEndedSignal: 0,
    }),
}));
