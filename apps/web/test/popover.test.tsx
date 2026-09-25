import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function renderPopover() {
  return render(
    <div>
      <Popover>
        <PopoverTrigger render={<button type="button">Show details</button>} />
        <PopoverContent>Seat limit details</PopoverContent>
      </Popover>
      <button type="button">Elsewhere</button>
    </div>,
  );
}

describe("Popover", () => {
  it("opensContent_whenTriggerClicked", async () => {
    const user = userEvent.setup();
    renderPopover();

    expect(screen.queryByText("Seat limit details")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show details" }));

    expect(await screen.findByText("Seat limit details")).toBeInTheDocument();
  });

  it("closesContent_whenEscapePressed", async () => {
    const user = userEvent.setup();
    renderPopover();

    await user.click(screen.getByRole("button", { name: "Show details" }));
    await screen.findByText("Seat limit details");

    await user.keyboard("{Escape}");

    expect(screen.queryByText("Seat limit details")).not.toBeInTheDocument();
  });

  it("closesContent_whenClickingOutside", async () => {
    const user = userEvent.setup();
    renderPopover();

    await user.click(screen.getByRole("button", { name: "Show details" }));
    await screen.findByText("Seat limit details");

    await user.click(screen.getByRole("button", { name: "Elsewhere" }));

    expect(screen.queryByText("Seat limit details")).not.toBeInTheDocument();
  });
});
