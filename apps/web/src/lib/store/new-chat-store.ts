import { createStore as create } from "@/lib/create-store";
import { TenantMember } from "@/features/chat/types/tenant-members/types";

interface NewChatStore {
  selectedUser: TenantMember | null;
  setSelectedUser: (user: TenantMember) => void;
  resetSelectedUser: () => void;
}

export const useNewChatStore = create<NewChatStore>()((set) => ({
  selectedUser: null,
  setSelectedUser: (selectedUser) => set({ selectedUser }),
  resetSelectedUser: () => set({ selectedUser: null }),
}));
