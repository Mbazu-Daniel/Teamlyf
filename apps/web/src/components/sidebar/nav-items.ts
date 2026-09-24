import type { Icon as TablerIcon } from "@tabler/icons-react";
import { IconHome, IconLayoutKanban, IconSettings } from "@tabler/icons-react";

export type NavItem = Readonly<{
  label: string;
  to: string;
  icon: TablerIcon;
  /** Section heading shown above the first item of each group. */
  group: string;
}>;

/**
 * Navigation is data, not markup — adding a module is one entry here.
 * Only routes that actually exist are listed; never render a dead link.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: "Home", to: "/", icon: IconHome, group: "Workspace" },
  { label: "Projects", to: "/projects", icon: IconLayoutKanban, group: "Workspace" },
  { label: "Settings", to: "/settings", icon: IconSettings, group: "Admin" },
];

/**
 * Exact match for root ("/" must not light up on every page),
 * prefix match everywhere else so child routes highlight the parent.
 */
export function isNavItemActive(pathname: string, to: string): boolean {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}
