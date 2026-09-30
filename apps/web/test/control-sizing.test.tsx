import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  pageInput,
  pagePrimaryAction,
  pageSecondaryAction,
} from "@/components/workspace/page-layout";

describe("shared control sizing", () => {
  it.each(["default", "sm", "lg", "auth", "app", "xs", "sm-relaxed", "app-wide"] as const)(
    "keeps %s text buttons at the shared height",
    (size) => {
      render(<Button size={size}>Action</Button>);
      expect(screen.getByRole("button", { name: "Action" })).toHaveClass("h-control");
    },
  );

  it.each(["default", "auth", "auth-password", "flat", "filled"] as const)(
    "keeps %s inputs at the shared height",
    (decor) => {
      render(<Input aria-label="Field" decor={decor} />);
      expect(screen.getByRole("textbox", { name: "Field" })).toHaveClass("h-control");
    },
  );

  it.each(["default", "sm"] as const)("keeps %s selectors aligned with inputs", (size) => {
    render(
      <Select>
        <SelectTrigger size={size} aria-label="Filter">
          <SelectValue />
        </SelectTrigger>
      </Select>,
    );
    expect(screen.getByRole("combobox", { name: "Filter" })).toHaveClass("h-control");
  });

  it("shares the same token with native page controls", () => {
    for (const classes of [pageInput, pagePrimaryAction, pageSecondaryAction]) {
      expect(classes.split(" ")).toContain("h-control");
    }
  });

  it("preserves compact icon-only controls", () => {
    render(
      <Button size="icon-sm" aria-label="Close">
        ×
      </Button>,
    );
    expect(screen.getByRole("button", { name: "Close" })).toHaveClass("size-8");
  });
});
