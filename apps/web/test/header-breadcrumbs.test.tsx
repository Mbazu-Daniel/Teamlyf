import { describe, expect, it } from "vitest";
import { getBreadcrumbs } from "@/components/header/breadcrumbs";

describe("getBreadcrumbs", () => {
  it("usesTheNavLabel_whenPathMatchesAKnownRoute", () => {
    expect(getBreadcrumbs("/settings").map((crumb) => crumb.label)).toEqual([
      "Teamlyf",
      "Settings",
    ]);
    expect(getBreadcrumbs("/projects")).toEqual([
      { label: "Teamlyf", to: "/projects" },
      { label: "Projects", to: "/projects" },
    ]);
  });

  it("keepsTheSegment_whenPathGoesDeeperThanARoute", () => {
    expect(getBreadcrumbs("/projects/proj-1")).toEqual([
      { label: "Teamlyf", to: "/projects" },
      { label: "Projects", to: "/projects" },
      { label: "proj-1", to: "/projects/proj-1" },
    ]);
  });

  it("returnsOnlyTheBrand_whenThereIsNothingToTraverse", () => {
    expect(getBreadcrumbs("/")).toEqual([{ label: "Teamlyf", to: "/projects" }]);
  });
});
