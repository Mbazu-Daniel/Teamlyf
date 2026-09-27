import { createStore as create } from "@/lib/create-store";

interface NavigationState {
  currentPage: string;
  subPage: string | null;
  setCurrentPage: (page: string) => void;
  setSubPage: (subPage: string | null) => void;
  resetNavigation: () => void;
}

export const useNavigationStore = create<NavigationState>()((set) => ({
  currentPage: "Dashboard",
  subPage: "",
  setCurrentPage: (currentPage) => set({ currentPage }),
  setSubPage: (subPage) => set({ subPage }),
  resetNavigation: () => set({ currentPage: "Dashboard", subPage: "" }),
}));
