import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function renderDialog() {
  return render(
    <Dialog>
      <DialogTrigger render={<Button>Open settings</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>Change your display name.</DialogDescription>
        </DialogHeader>
        <Button>Save changes</Button>
      </DialogContent>
    </Dialog>,
  );
}

describe("Dialog", () => {
  it("opens_fromTrigger_whenClicked_isLabelledModal", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "Open settings" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAccessibleName("Edit profile");
    expect(screen.getByText("Change your display name.")).toBeInTheDocument();
  });

  it("closes_onEscape_whenOpen_returnsFocusToTrigger", async () => {
    const user = userEvent.setup();
    renderDialog();
    const trigger = screen.getByRole("button", { name: "Open settings" });

    await user.click(trigger);
    await screen.findByRole("dialog");

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("trapsFocus_whenTabbing_neverLeavesDialog", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "Open settings" }));
    const dialog = await screen.findByRole("dialog");

    expect(dialog.contains(document.activeElement)).toBe(true);

    for (let step = 0; step < 4; step += 1) {
      await user.tab();
      await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    }
  });
});
