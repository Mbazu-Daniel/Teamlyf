import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { StatusColumn } from "@/features/projects";
import type { ProjectTask, Status } from "@/lib/api";

const todo: Status = {
  id: "s1",
  projectId: "p1",
  name: "Todo",
  color: "#60646C",
  group: "todo",
  sequence: 1000,
  default: true,
};

const doing: Status = {
  id: "s2",
  projectId: "p1",
  name: "Doing",
  color: "#0091FF",
  group: "started",
  sequence: 2000,
  default: false,
};

function makeTask(id: string, name: string, statusId: string): ProjectTask {
  return {
    id,
    name,
    description: null,
    priority: "high",
    statusId,
    targetDate: null,
  };
}

const statuses = [todo, doing];

afterEach(() => {
  cleanup();
});

describe("StatusColumn", () => {
  it("renders_onlyItsOwnTasks_withTheStatusCount", () => {
    render(
      <StatusColumn
        status={todo}
        statuses={statuses}
        tasks={[makeTask("t1", "Write spec", "s1"), makeTask("t2", "Ship API", "s2")]}
        onMove={vi.fn()}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText("Write spec")).toBeDefined();
    expect(screen.queryByText("Ship API")).toBeNull();
    expect(screen.getByRole("heading", { name: "Todo" })).toBeDefined();
    expect(screen.getByText("1")).toBeDefined();
  });

  it("renders_emptyState_whenNoTasksInStatus", () => {
    render(
      <StatusColumn
        status={todo}
        statuses={statuses}
        tasks={[makeTask("t1", "Elsewhere", "s2")]}
        onMove={vi.fn()}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText("No tasks")).toBeDefined();
  });

  it("calls_onMove_withTheTaskAndPickedStatus", async () => {
    const onMove = vi.fn();
    const user = userEvent.setup();
    render(
      <StatusColumn
        status={todo}
        statuses={statuses}
        tasks={[makeTask("t1", "Write spec", "s1")]}
        onMove={onMove}
        onSelect={vi.fn()}
      />,
    );

    const selects = screen.getAllByRole("combobox");
    expect(selects).toHaveLength(1);
    await user.selectOptions(selects[0] as HTMLSelectElement, "s2");

    expect(onMove).toHaveBeenCalledTimes(1);
    const [task, statusId] = onMove.mock.calls[0] as [ProjectTask, string];
    expect(task.id).toBe("t1");
    expect(statusId).toBe("s2");
  });

  it("calls_onSelect_withTheTask_whenTaskNameClicked", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <StatusColumn
        status={todo}
        statuses={statuses}
        tasks={[makeTask("t1", "Write spec", "s1")]}
        onMove={vi.fn()}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Write spec" }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0]?.[0]).toMatchObject({ id: "t1", name: "Write spec" });
  });
});
