import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function renderMenu({ onRename }: { onRename?: () => void } = {}) {
  return render(
    <DropdownMenu>
      <DropdownMenuTrigger render={<button type="button">Actions</button>} />
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Workspace</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuItem onClick={onRename}>Rename</DropdownMenuItem>
        <DropdownMenuItem>Duplicate</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  );
}

describe("DropdownMenu", () => {
  it("opensMenu_whenTriggerClicked_exposesMenuRole", async () => {
    const user = userEvent.setup();
    renderMenu();

    const trigger = screen.getByRole("button", { name: "Actions" });
    await user.click(trigger);

    const items = await screen.findAllByRole("menuitem");
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(items.map((item) => item.textContent)).toEqual(["Rename", "Duplicate", "Delete"]);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("movesHighlight_withArrowKeys", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole("button", { name: "Actions" }));
    await screen.findByRole("menuitem", { name: "Rename" });

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Rename" })).toHaveAttribute("data-highlighted");

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Duplicate" })).toHaveAttribute("data-highlighted");
  });

  it("runsItemHandler_whenItemClicked_closesMenu", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    renderMenu({ onRename });

    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(await screen.findByRole("menuitem", { name: "Rename" }));

    expect(onRename).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closesWithoutRunningHandler_whenEscapePressed", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    renderMenu({ onRename });

    await user.click(screen.getByRole("button", { name: "Actions" }));
    await screen.findByRole("menuitem", { name: "Rename" });
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(onRename).not.toHaveBeenCalled();
  });
});
