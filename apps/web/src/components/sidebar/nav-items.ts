import type { Icon as TablerIcon } from "@tabler/icons-react";
import { IconHome, IconLayoutKanban, IconSettings } from "@tabler/icons-react";


export type NavItem = Readonly<{
  /** Stable identity — React key and active-state matching. */
  id: string;
  label: string;
  /** Route suffix inside the active organization. */
  to: string;
  icon: TablerIcon;
}>;

export type NavSection = Readonly<{
  id: string;
  /** Heading above the section; hidden while the sidebar is collapsed. */
  label: string;
  items: readonly NavItem[];
}>;

/**
 * Navigation is data, not markup: a new module is one item below (or one new
 * section) — no component reads a route name it was not given. List only
 * routes that exist; see `NavRoute`.
 */
export const NAV_SECTIONS: readonly NavSection[] = [
  {
    id: "workspace",
    label: "Workspace",
    items: [
      // Stand-in for the dashboard (ticket 10): change `to` to "/dashboard".
      { id: "home", label: "Home", to: "", icon: IconHome },
      { id: "projects", label: "Projects", to: "projects", icon: IconLayoutKanban },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    items: [{ id: "settings", label: "Settings", to: "settings", icon: IconSettings }],
  },
];

/** Flat view, used for active-state matching and breadcrumbs. */
export const NAV_ITEMS: readonly NavItem[] = NAV_SECTIONS.flatMap((section) => section.items);

/** First Workspace entry — where "home" points inside the shell. */
export const NAV_HOME: NavItem = NAV_SECTIONS[0].items[0];

/**
 * Exact match for root routes ("/" must not light up on every page),
 * prefix match everywhere else so child routes highlight the parent.
 */
export function isNavItemActive(pathname: string, to: string): boolean {
  if (!to) return pathname.split("/").filter(Boolean).length === 1;
  return pathname === `/${to}` || pathname.endsWith(`/${to}`) || pathname.includes(`/${to}/`);
}

/**
 * The one entry that owns `pathname`: the last match wins, so a stand-in
 * entry sharing a route with the specific entry after it (Home on /projects)
 * never steals the accent. Null when the route has no owner.
 */
export function findActiveNavItem(pathname: string): NavItem | null {
  return NAV_ITEMS.filter((item) => isNavItemActive(pathname, item.to)).at(-1) ?? null;
}
