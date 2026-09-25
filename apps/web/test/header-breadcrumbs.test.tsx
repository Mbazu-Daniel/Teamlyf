import { describe, expect, it } from "vitest";
import { getBreadcrumbs } from "@/components/header/breadcrumbs";

describe("getBreadcrumbs", () => {
  it("omitsTheWorkspace_whenPathMatchesAKnownRoute", () => {
    expect(getBreadcrumbs("/acme/settings").map((crumb) => crumb.label)).toEqual(["Settings"]);
    expect(getBreadcrumbs("/acme/projects")).toEqual([
      { label: "Projects", to: "/acme/projects" },
    ]);
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
});
