import { describe, expect, it } from "vitest";
import { getBreadcrumbs } from "@/components/header/breadcrumbs";

describe("getBreadcrumbs", () => {
  it("usesTheNavLabel_whenPathMatchesAKnownRoute", () => {
    expect(getBreadcrumbs("/acme/settings").map((crumb) => crumb.label)).toEqual(["Teamlyf", "Settings"]);
    expect(getBreadcrumbs("/acme/projects")).toEqual([
      { label: "Teamlyf", to: "/acme" },
      { label: "Projects", to: "/acme/projects" },
    ]);
  });

  it("keepsTheSegment_whenPathGoesDeeperThanARoute", () => {
    expect(getBreadcrumbs("/acme/projects/proj-1")).toEqual([
      { label: "Teamlyf", to: "/acme" },
      { label: "Projects", to: "/acme/projects" },
      { label: "proj-1", to: "/acme/projects/proj-1" },
    ]);
  });

  it("returnsOnlyTheBrand_whenThereIsNothingToTraverse", () => {
    expect(getBreadcrumbs("/")).toEqual([]);
  });
});
