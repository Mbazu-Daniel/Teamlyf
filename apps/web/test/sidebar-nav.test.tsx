import { describe, expect, it } from "vitest";
import {
  NAV_HOME,
  NAV_ITEMS,
  NAV_SECTIONS,
  findActiveNavItem,
  isNavItemActive,
} from "@/components/sidebar/nav-items";

describe("nav data", () => {
  it("groupsEntries_underWorkspaceAndAdminHeadings", () => {
    expect(NAV_SECTIONS.map((section) => section.label)).toEqual(["Workspace", "Admin"]);
    expect(NAV_SECTIONS[0].items.map((item) => item.label)).toEqual(["Overview", "Projects", "Tasks", "Chat", "Documents", "Notes", "Schedule", "HR", "Calls", "Notifications"]);
    expect(NAV_SECTIONS[1].items.map((item) => item.label)).toEqual(["Settings"]);
  });

  it("keepsEntryIdsUnique_soKeysAndActiveStateNeverCollide", () => {
    const ids = NAV_ITEMS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keepsEveryEntryInsideTheApp_neverOnTheMarketingRoot", () => {
    expect(NAV_ITEMS.map((item) => item.to)).not.toContain("/");
    // Overview is the organization root, not the marketing root.
    expect(NAV_HOME.to).toBe("");
  });
});

describe("active matching", () => {
  it("accentsProjects_whenOnProjectsRoute", () => {
    expect(findActiveNavItem("/acme/projects")?.id).toBe("projects");
  });

  it("accentsTheSection_whenOnAChildRoute", () => {
    expect(findActiveNavItem("/acme/projects/proj-1")?.id).toBe("projects");
    expect(findActiveNavItem("/acme/settings/access")?.id).toBe("settings");
  });

  it("accentsNothing_whenOnARouteWithNoEntry", () => {
    expect(findActiveNavItem("/")).toBeNull();
    expect(findActiveNavItem("/acme/somewhere-else")).toBeNull();
  });

  it("matchesRootRoutesExactly_soAForwardSlashEntryNeverLightsUpEverywhere", () => {
    expect(isNavItemActive("/acme", "/acme")).toBe(true);
    expect(isNavItemActive("/acme/projects", "/acme")).toBe(false);
  });

  it("selectsOnlyTheMostSpecificEntry_forCallsInsideChat", () => {
    expect(findActiveNavItem("/acme/chats/calls")?.id).toBe("calls");
    expect(findActiveNavItem("/acme/chats/channel/team")?.id).toBe("chat");
    expect(findActiveNavItem("/acme")?.id).toBe("home");
  });
});
