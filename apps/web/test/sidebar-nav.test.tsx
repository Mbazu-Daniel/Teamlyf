import { describe, expect, it } from "vitest";
import {
  NAV_HOME,
  NAV_ITEMS,
  NAV_SECTIONS,
  findActiveNavItem,
  isNavItemActive,
} from "@/components/sidebar/nav-items";

describe("nav data", () => {
  it("keepsThePrimarySectionUnnamed_andNamesTheRest", () => {
    expect(NAV_SECTIONS[0].label).toBeUndefined();
    expect(NAV_SECTIONS).toHaveLength(1);
    expect(NAV_SECTIONS[0].items.map((item) => item.label)).toEqual([
      "Overview",
      "Members",
      "Projects",
      "Tasks",
      "Chat",
      "Documents",
      "Notes",
      "Schedule",
      "HR",
      "Notifications",
    ]);
  });

  it("putsMembersDirectlyAfterOverview_sinceItIsWhoIsInTheWorkspace", () => {
    const labels = NAV_SECTIONS[0].items.map((item) => item.label);
    expect(labels.indexOf("Members")).toBe(labels.indexOf("Overview") + 1);
  });

  it("keepsSettingsOutOfTheRail_sinceItLivesInTheProfileMenu", () => {
    expect(NAV_ITEMS.map((item) => item.id)).not.toContain("settings");
  });

  it("keepsEntryIdsUnique_soKeysAndActiveStateNeverCollide", () => {
    const ids = NAV_ITEMS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keepsEveryEntryInsideTheApp_neverOnTheMarketingRoot", () => {
    expect(NAV_ITEMS.map((item) => item.to)).not.toContain("/");

    expect(NAV_HOME.to).toBe("");
  });
});

describe("active matching", () => {
  it("accentsProjects_whenOnProjectsRoute", () => {
    expect(findActiveNavItem("/acme/projects")?.id).toBe("projects");
  });

  it("accentsTheSection_whenOnAChildRoute", () => {
    expect(findActiveNavItem("/acme/projects/proj-1")?.id).toBe("projects");
    expect(findActiveNavItem("/acme/people")?.id).toBe("people");
  });

  it("accentsMembers_whenOnTheStandaloneMembersRoute", () => {
    expect(findActiveNavItem("/acme/members")?.id).toBe("members");
  });

  it("keepsTheHrEntryActive_whenAnotherSectionIsOpen", () => {
    expect(findActiveNavItem("/acme/people", "section=departments")?.id).toBe("people");
    expect(findActiveNavItem("/acme/people", "section=leave")?.id).toBe("people");
  });

  it("accentsNothing_onSettings_becauseItIsNoLongerInTheRail", () => {
    expect(findActiveNavItem("/acme/settings")).toBeNull();
    expect(findActiveNavItem("/acme/settings/access")).toBeNull();
  });

  it("accentsNothing_whenOnARouteWithNoEntry", () => {
    expect(findActiveNavItem("/")).toBeNull();
    expect(findActiveNavItem("/acme/somewhere-else")).toBeNull();
  });

  it("matchesRootRoutesExactly_soAForwardSlashEntryNeverLightsUpEverywhere", () => {
    expect(isNavItemActive("/acme", "/acme")).toBe(true);
    expect(isNavItemActive("/acme/projects", "/acme")).toBe(false);
  });

  it("selectsOnlyTheMostSpecificEntry_insideChat", () => {
    expect(findActiveNavItem("/acme/chats/channel/team")?.id).toBe("chat");
    expect(findActiveNavItem("/acme")?.id).toBe("home");
  });
});
