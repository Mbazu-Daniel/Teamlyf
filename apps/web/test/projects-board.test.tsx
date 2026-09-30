import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GroupedBoard, KanbanBoard, StatusColumn } from "@/features/projects/board";
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
    sequenceId: Number(id.replace(/\D/g, "")) || 1,
    name,
    description: null,
    priority: "high",
    statusId,
    startDate: null,
    targetDate: null,
  };
}

const statuses = [todo, doing];

afterEach(() => {
  cleanup();
});

describe("Board layout", () => {
  it.each(["project", "grouped"])(
    "keeps the %s board compact with hidden, usable scroll areas",
    (kind) => {
      const tasks = [makeTask("t1", "Write spec", "s1")];
      const { container } = render(
        kind === "project" ? (
          <KanbanBoard statuses={statuses} tasks={tasks} onMove={vi.fn()} onSelect={vi.fn()} />
        ) : (
          <GroupedBoard
            columns={[{ id: "today", name: "Today", color: "orange", tasks }]}
            allTasks={tasks}
            statusesFor={() => statuses}
            onDropColumn={vi.fn()}
            onSelect={vi.fn()}
          />
        ),
      );

      const board = container.firstElementChild!;
      expect(board.classList.contains("h-[380px]")).toBe(true);
      expect(board.classList.contains("scrollbar-hidden")).toBe(true);
      expect(board.classList.contains("overflow-x-auto")).toBe(true);
      for (const column of container.querySelectorAll("section")) {
        expect(column.classList.contains("min-h-0")).toBe(true);
        expect(
          column.querySelector(".overflow-y-auto")?.classList.contains("scrollbar-hidden"),
        ).toBe(true);
      }
    },
  );
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

    expect(screen.getByText("Drop tasks here")).toBeDefined();
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
    await user.click(selects[0]);
    await user.click(await screen.findByRole("option", { name: "Doing" }));

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
