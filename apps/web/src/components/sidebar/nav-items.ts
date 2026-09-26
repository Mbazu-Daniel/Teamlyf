import type { Icon as TablerIcon } from "@tabler/icons-react";
import {
  IconFileText,
  IconHome,
  IconLayoutKanban,
  IconMessage,
  IconNotes,
  IconPhone,
  IconSettings,
  IconUsers,
  IconCheck,
  IconList,\n  IconCalendar,\n  IconBell,
} from "@tabler/icons-react";

export type NavChild = Readonly<{
  id: string;
  label: string;
  to: string;
  icon: TablerIcon;
}>;

export type NavItem = Readonly<{
  id: string;
  label: string;
  /** Route suffix inside the active organization. Empty means the organization home. */
  to: string;
  icon: TablerIcon;
  /** Landing-page features whose app routes are not implemented yet stay visual-only. */
  available?: boolean;
  children?: readonly NavChild[];
}>;

export type NavSection = Readonly<{
  id: string;
  label: string;
  items: readonly NavItem[];
}>;

export const NAV_SECTIONS: readonly NavSection[] = [
  {
    id: "workspace",
    label: "Workspace",
    items: [
      { id: "home", label: "Overview", to: "", icon: IconHome },
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
      { id: "chat", label: "Chat", to: "chat", icon: IconMessage },
      { id: "documents", label: "Documents", to: "documents", icon: IconFileText },
      { id: "notes", label: "Notes", to: "notes", icon: IconNotes },\n      { id: "schedule", label: "Schedule", to: "schedule", icon: IconCalendar },
      { id: "people", label: "People & HR", to: "people", icon: IconUsers },
      { id: "calls", label: "Calls", to: "calls", icon: IconPhone },\n      { id: "notifications", label: "Notifications", to: "notifications", icon: IconBell },
      // AI agents are temporarily hidden from navigation. The implementation remains intact.\n      // { id: "ai", label: "AI agents", to: "ai", icon: IconRobot },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    items: [{ id: "settings", label: "Settings", to: "settings", icon: IconSettings }],
  },
];

export const NAV_ITEMS: readonly NavItem[] = NAV_SECTIONS.flatMap((section) => section.items);
export const NAV_HOME: NavItem = NAV_SECTIONS[0].items[0];

export function isNavItemActive(pathname: string, to: string): boolean {
  const path = to.split("?")[0];
  if (!path) return pathname.split("/").filter(Boolean).length === 1;
  return pathname === "/" + path || pathname.endsWith("/" + path) || pathname.includes("/" + path + "/");
}

export function findActiveNavItem(pathname: string): NavItem | null {
  return NAV_ITEMS.filter((item) => item.available !== false && isNavItemActive(pathname, item.to)).at(-1) ?? null;
}
