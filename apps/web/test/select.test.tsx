import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function renderRoleSelect({ onValueChange, disabled = false }: { onValueChange?: (value: string) => void; disabled?: boolean }) {
  return render(
    <Select defaultValue="member" items={{ member: "Member", admin: "Admin", owner: "Owner" }} onValueChange={onValueChange}>
      <SelectTrigger aria-label="Role" disabled={disabled}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="member">Member</SelectItem>
        <SelectItem value="admin">Admin</SelectItem>
        <SelectItem value="owner">Owner</SelectItem>
      </SelectContent>
    </Select>,
  );
}

describe("Select", () => {
  it("showsCurrentSelection_whenClosed_exposesCombobox", () => {
    renderRoleSelect({});

    const trigger = screen.getByRole("combobox", { name: "Role" });
    expect(trigger).toHaveTextContent("Member");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("opensListbox_whenTriggerClicked_listsEveryOption", async () => {
    const user = userEvent.setup();
    renderRoleSelect({});

    await user.click(screen.getByRole("combobox", { name: "Role" }));

    await screen.findByRole("listbox");
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["Member", "Admin", "Owner"]);
    expect(screen.getByRole("option", { name: "Member" })).toHaveAttribute("aria-selected", "true");
  });

  it("movesHighlight_withArrowDown_commitsWithEnter", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderRoleSelect({ onValueChange });

    const trigger = screen.getByRole("combobox", { name: "Role" });
    await user.click(trigger);
    await screen.findByRole("listbox");
    await user.keyboard("{ArrowDown}");

    expect(screen.getByRole("option", { name: "Admin" })).toHaveAttribute("data-highlighted");

    await user.keyboard("{Enter}");

    expect(onValueChange).toHaveBeenCalledWith("admin");
    expect(trigger).toHaveTextContent("Admin");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closesWithoutChange_whenEscapePressed", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderRoleSelect({ onValueChange });

    await user.click(screen.getByRole("combobox", { name: "Role" }));
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("staysClosed_whenDisabled", async () => {
    const user = userEvent.setup();
    renderRoleSelect({ disabled: true });

    const trigger = screen.getByRole("combobox", { name: "Role" });
    expect(trigger).toBeDisabled();

    await user.click(trigger);

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
