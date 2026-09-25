import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

function renderConfirm({ onConfirm, destructive = true }: { onConfirm: () => void; destructive?: boolean }) {
  return render(
    <ConfirmDialog
      trigger={<Button>Remove</Button>}
      title="Remove this member?"
      description="They will lose access to this workspace."
      confirmLabel="Remove"
      cancelLabel="Keep member"
      destructive={destructive}
      onConfirm={onConfirm}
    />,
  );
}

describe("ConfirmDialog", () => {
  it("asksForConfirmation_whenTriggerClicked", async () => {
    const user = userEvent.setup();
    renderConfirm({ onConfirm: vi.fn() });

    await user.click(screen.getByRole("button", { name: "Remove" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAccessibleName("Remove this member?");
    expect(screen.getByText("They will lose access to this workspace.")).toBeInTheDocument();
  });

  it("runsConfirmAction_whenConfirmClicked_closesDialog", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderConfirm({ onConfirm });

    await user.click(screen.getByRole("button", { name: "Remove" }));
    const dialog = await screen.findByRole("dialog");

    await user.click(within(dialog).getByRole("button", { name: "Remove" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("doesNothing_whenCancelClicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderConfirm({ onConfirm });

    await user.click(screen.getByRole("button", { name: "Remove" }));
    await user.click(await screen.findByRole("button", { name: "Keep member" }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("doesNothing_whenEscapePressed", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderConfirm({ onConfirm });

    await user.click(screen.getByRole("button", { name: "Remove" }));
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
