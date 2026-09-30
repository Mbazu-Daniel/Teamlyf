import { describe, expect, it } from "vitest";
import { getBreadcrumbs } from "@/components/header/breadcrumbs";

describe("getBreadcrumbs", () => {
  it("usesReadableLabelsForChatAndPeoplePages", () => {
    expect(getBreadcrumbs("/acme/chats/threads").map((crumb) => crumb.label)).toEqual([
      "Chat",
      "Threads",
    ]);
    expect(getBreadcrumbs("/acme/people").map((crumb) => crumb.label)).toEqual(["HR"]);
  });
  it("omitsTheWorkspace_whenPathMatchesAKnownRoute", () => {
    expect(getBreadcrumbs("/acme/settings").map((crumb) => crumb.label)).toEqual(["Settings"]);
    expect(getBreadcrumbs("/acme/projects")).toEqual([{ label: "Projects", to: "/acme/projects" }]);
  });

  it("keepsTheSegment_whenPathGoesDeeperThanARoute", () => {
    expect(getBreadcrumbs("/acme/projects/proj-1")).toEqual([
      { label: "Projects", to: "/acme/projects" },
      { label: "proj-1", to: "/acme/projects/proj-1" },
    ]);
  });

  it("returnsEmpty_whenThereIsOnlyAWorkspaceSegment", () => {
    expect(getBreadcrumbs("/acme")).toEqual([]);
    expect(getBreadcrumbs("/")).toEqual([]);
  });

  it("namesTheHrSection_whenItIsCarriedInTheQuery", () => {
    expect(getBreadcrumbs("/acme/people", [], "section=departments")).toEqual([
      { label: "HR", to: "/acme/people" },
      { label: "Departments", to: "/acme/people?section=departments" },
    ]);
    expect(getBreadcrumbs("/acme/people", [], "section=org-chart").at(-1)?.label).toBe("Org chart");
  });

  it("labelsTheStandaloneMembersRoute", () => {
    expect(getBreadcrumbs("/acme/members")).toEqual([{ label: "Members", to: "/acme/members" }]);
  });

  it("doesNotTreatMembersAsAnHrSection", () => {
    // The directory has its own route, so the HR crumb stays the only one.
    expect(getBreadcrumbs("/acme/people", [], "section=members").map((c) => c.label)).toEqual([
      "HR",
    ]);
  });

  it("ignoresTheRetiredEmployeesSection", () => {
    expect(getBreadcrumbs("/acme/people", [], "section=employees").map((c) => c.label)).toEqual([
      "HR",
    ]);
  });

  it("ignoresAnUnknownOrMissingHrSection", () => {
    expect(getBreadcrumbs("/acme/people", [], "section=nope").map((c) => c.label)).toEqual(["HR"]);
    expect(getBreadcrumbs("/acme/people").map((c) => c.label)).toEqual(["HR"]);
  });

  it("labelsTheSettingsProfileAndLeaveTabs", () => {
    expect(getBreadcrumbs("/acme/settings/profile").map((c) => c.label)).toEqual([
      "Settings",
      "Profile",
    ]);
    expect(getBreadcrumbs("/acme/settings/leave").map((c) => c.label)).toEqual([
      "Settings",
      "Leave",
    ]);
  });
});
