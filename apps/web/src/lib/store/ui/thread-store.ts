import { createStore as create } from "@/lib/create-store";
import { Message } from "@/features/chat/types/messages/types";
import { TenantMember } from "@/features/chat/types/tenant-members/types";

interface ThreadState {
  activeThread: Message | null;
  activeThreadType: "channel" | "direct" | null;
  isThreadOpen: boolean;
  isChatSidebarOpen: boolean;
  chatId: string | null;

  profileMember: Partial<TenantMember> | null;
  isProfileOpen: boolean;

  setActiveThread: (payload: {
    message: Message | null;
    type: "channel" | "direct" | null;
  }) => void;
  setIsThreadOpen: (isOpen: boolean) => void;
  setIsChatSidebarOpen: (isOpen: boolean) => void;
  setChatId: (chatId: string | null) => void;
  setProfileMember: (member: Partial<TenantMember> | null) => void;
  setIsProfileOpen: (isOpen: boolean) => void;
  resetThread: () => void;
}

export const useThreadStore = create<ThreadState>()((set) => ({
  activeThread: null,
  activeThreadType: null,
  isThreadOpen: false,
  isChatSidebarOpen: false,
  chatId: null,
  profileMember: null,
  isProfileOpen: false,

  setActiveThread: (payload) =>
    set({
      activeThread: payload.message,
      activeThreadType: payload.type,
    }),
  setIsThreadOpen: (isThreadOpen) => set({ isThreadOpen }),
  setIsChatSidebarOpen: (isChatSidebarOpen) => set({ isChatSidebarOpen }),
  setChatId: (chatId) => set({ chatId }),
  setProfileMember: (profileMember) => set({ profileMember }),
  setIsProfileOpen: (isProfileOpen) => set({ isProfileOpen }),
  resetThread: () =>
    set({
      activeThread: null,
      activeThreadType: null,
      isThreadOpen: false,
      isChatSidebarOpen: false,
      chatId: null,
      profileMember: null,
      isProfileOpen: false,
    }),
}));
