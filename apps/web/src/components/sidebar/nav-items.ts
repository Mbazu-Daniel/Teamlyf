import type { Icon as TablerIcon } from "@tabler/icons-react";
import {
  IconBell,
  IconCalendar,
  IconCheck,
  IconFileText,
  IconHome,
  IconLayoutKanban,
  IconList,
  IconMessage,
  IconNotes,
  IconUserPlus,
  IconUsers,
} from "@tabler/icons-react";

export type NavChild = Readonly<{ id: string; label: string; to: string; icon: TablerIcon }>;
export type NavItem = Readonly<{
  id: string;
  label: string;
  to: string;
  search?: Readonly<Record<string, string>>;
  icon: TablerIcon;
  available?: boolean;
  children?: readonly NavChild[];
}>;

export type NavSection = Readonly<{ id: string; label?: string; items: readonly NavItem[] }>;

export const NAV_SECTIONS: readonly NavSection[] = [
  {
    id: "workspace",
    items: [
      { id: "home", label: "Overview", to: "", icon: IconHome },
      // Right after Overview: who is in the workspace is the first question
      // after "what is happening".
      { id: "members", label: "Members", to: "members", icon: IconUserPlus },
      { id: "projects", label: "Projects", to: "projects", icon: IconLayoutKanban },
      {
        id: "tasks",
        label: "Tasks",
        to: "tasks",
        icon: IconCheck,
        children: [
          { id: "task-board", label: "Board", to: "tasks?view=board", icon: IconLayoutKanban },
          { id: "task-list", label: "List", to: "tasks?view=list", icon: IconList },
        ],
      },
      { id: "chat", label: "Chat", to: "chats", icon: IconMessage },
      { id: "documents", label: "Documents", to: "documents", icon: IconFileText },
      { id: "notes", label: "Notes", to: "notes", icon: IconNotes },
      { id: "schedule", label: "Schedule", to: "schedule", icon: IconCalendar },
      { id: "people", label: "HR", to: "people", icon: IconUsers },
      { id: "notifications", label: "Notifications", to: "notifications", icon: IconBell },
      // AI agents are temporarily hidden from navigation. The implementation remains intact.
      // { id: "ai", label: "AI agents", to: "ai", icon: IconRobot },
    ],
  },
];

export const NAV_ITEMS: readonly NavItem[] = NAV_SECTIONS.flatMap((section) => section.items);
export const NAV_HOME: NavItem = NAV_SECTIONS[0].items[0];
export function isNavItemActive(
  pathname: string,
  to: string,
  searchStr?: string,
  search?: Readonly<Record<string, string>>,
) {
  const path = to.split("?")[0];
  if (!path) return pathname.split("/").filter(Boolean).length === 1;
  const pathMatches = path.startsWith("/")
    ? pathname === path
    : pathname === "/" + path ||
      pathname.endsWith("/" + path) ||
      pathname.includes("/" + path + "/");
  if (!pathMatches) return false;
  if (!search) return true;
  if (!searchStr) return false;
  const actual = new URLSearchParams(searchStr);
  return Object.entries(search).every(([key, value]) => actual.get(key) === value);
}
export function findActiveNavItem(pathname: string, searchStr?: string) {
  const candidates = NAV_ITEMS.filter(
    (item) =>
      item.available !== false && isNavItemActive(pathname, item.to, searchStr, item.search),
  );
  // A query-constrained entry is more specific than the bare route entry
  // pointing at the same path, so it wins even when the bare one is listed
  // later. Plain "last match wins" only holds when the specific entry happens
  // to follow its parent.
  const constrained = candidates.filter((item) => item.search);
  return constrained.at(-1) ?? candidates.at(-1) ?? null;
}
