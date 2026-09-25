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
    expect(NAV_SECTIONS[0].items.map((item) => item.label)).toEqual(["Home", "Projects"]);
    expect(NAV_SECTIONS[1].items.map((item) => item.label)).toEqual(["Settings"]);
  });

  it("keepsEntryIdsUnique_soKeysAndActiveStateNeverCollide", () => {
    const ids = NAV_ITEMS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keepsEveryEntryInsideTheApp_neverOnTheMarketingRoot", () => {
    expect(NAV_ITEMS.map((item) => item.to)).not.toContain("/");
    // Stands in for the dashboard until ticket 10 lands one.
    expect(NAV_HOME.to).toBe("");
  });
});

describe("active matching", () => {
  it("accentsProjects_whenOnProjectsRoute_homeSharesTheRouteAsAStandIn", () => {
    expect(findActiveNavItem("/acme/projects")?.id).toBe("projects");
  });

  it("accentsTheSection_whenOnAChildRoute", () => {
    expect(findActiveNavItem("/acme/projects/proj-1")?.id).toBe("projects");
    expect(findActiveNavItem("/acme/settings/access")?.id).toBe("settings");
  });

  it("accentsNothing_whenOnARouteWithNoEntry", () => {
    expect(findActiveNavItem("/")).toBeNull();
    expect(findActiveNavItem("/somewhere-else")).toBeNull();
  });

  it("matchesRootRoutesExactly_soAForwardSlashEntryNeverLightsUpEverywhere", () => {
    expect(isNavItemActive("/acme", "/acme")).toBe(true);
    expect(isNavItemActive("/acme/projects", "/acme")).toBe(false);
  });
});
