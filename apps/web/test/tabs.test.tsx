import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

function renderTabs({ onValueChange }: { onValueChange?: (value: string) => void } = {}) {
  return render(
    <Tabs defaultValue="overview" onValueChange={onValueChange}>
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="members">Members</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Overview panel</TabsContent>
      <TabsContent value="members">Members panel</TabsContent>
    </Tabs>,
  );
}

describe("Tabs", () => {
  it("showsFirstPanel_whenIdle_exposesTabRoles", () => {
    renderTabs();

    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual(["Overview", "Members"]);
    expect(tabs[0]).toHaveAttribute("data-active");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Overview panel");
  });

  it("switchesPanel_whenTabClicked", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderTabs({ onValueChange });

    await user.click(screen.getByRole("tab", { name: "Members" }));

    expect(screen.getByRole("tabpanel")).toHaveTextContent("Members panel");
    expect(onValueChange).toHaveBeenCalledWith("members", expect.anything());
  });

  it("movesAndActivates_withArrowKeys_whenFocusInTabList", async () => {
    const user = userEvent.setup();
    renderTabs();

    screen.getByRole("tab", { name: "Members" }).focus();
    await user.keyboard("{ArrowLeft}");

    expect(screen.getByRole("tab", { name: "Overview" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("data-active");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Overview panel");
  });
});
