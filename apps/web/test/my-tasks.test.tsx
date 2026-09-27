import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GroupedBoard, buildMyTasksRows, dateGroupOf, groupRowsByDate, isDateGroupId, rescheduleDateFor } from "@/features/projects";
import type { Project, ProjectTask, Status } from "@/lib/api";

/** Fixed "today" so bucket boundaries never depend on when the suite runs. */
const TODAY = new Date(2026, 8, 27);

function makeTask(overrides: Pick<ProjectTask, "id" | "name"> & Partial<ProjectTask>): ProjectTask {
  return {
    sequenceId: 1,
    description: null,
    priority: "medium",
    statusId: "s1",
    startDate: null,
    targetDate: null,
    ...overrides,
  };
}

function day(task: ProjectTask, today = TODAY) {
  return dateGroupOf(task, today);
}

describe("dateGroupOf", () => {
  it("buckets_onLocalCalendarDay_notOnTheInstant", () => {
    expect(day(makeTask({ id: "t1", name: "Late", targetDate: new Date(2026, 8, 26).toISOString() }))).toBe("overdue");
    expect(day(makeTask({ id: "t2", name: "Now", targetDate: new Date(2026, 8, 27, 23, 30).toISOString() }))).toBe("today");
    expect(day(makeTask({ id: "t3", name: "Soon", targetDate: new Date(2026, 8, 28).toISOString() }))).toBe("upcoming");
  });

  it("treats_absentOrUnparseableDates_asNoDueDate_ratherThanOverdue", () => {
    expect(day(makeTask({ id: "t4", name: "Someday" }))).toBe("undated");
    expect(day(makeTask({ id: "t5", name: "Broken", targetDate: "not-a-date" }))).toBe("undated");
  });
});

describe("groupRowsByDate", () => {
  it("keepsAllFourSections_inOrder_withCountsAndLabels", () => {
    const groups = groupRowsByDate(
      [
        { task: makeTask({ id: "t1", name: "Late", targetDate: new Date(2026, 8, 20).toISOString() }) },
        { task: makeTask({ id: "t2", name: "Now", targetDate: new Date(2026, 8, 27).toISOString() }) },
        { task: makeTask({ id: "t3", name: "Someday" }) },
      ],
      TODAY,
    );

    expect(groups.map((group) => group.label)).toEqual(["Overdue", "Today", "Upcoming", "No due date"]);
    expect(groups.map((group) => group.rows.length)).toEqual([1, 1, 0, 1]);
    expect(groups[2].rows).toEqual([]);
  });
});

describe("rescheduleDateFor", () => {
  it("lands_onTheNearestDayInsideEachBucket", () => {
    expect(pick(rescheduleDateFor("overdue", TODAY))).toEqual([2026, 8, 26]);
    expect(pick(rescheduleDateFor("today", TODAY))).toEqual([2026, 8, 27]);
    expect(pick(rescheduleDateFor("upcoming", TODAY))).toEqual([2026, 8, 28]);
  });

  it("crosses_monthBoundaries_withoutLandingInTheWrongBucket", () => {
    const monthStart = new Date(2026, 8, 1);
    const monthEnd = new Date(2026, 8, 30);
    expect(pick(rescheduleDateFor("overdue", monthStart))).toEqual([2026, 7, 31]);
    expect(pick(rescheduleDateFor("upcoming", monthEnd))).toEqual([2026, 9, 1]);
  });

  it("refuses_noDueDate_becauseTheEndpointCannotClearADate", () => {
    expect(rescheduleDateFor("undated", TODAY)).toBeNull();
    expect(isDateGroupId("undated")).toBe(true);
    expect(isDateGroupId("all")).toBe(false);
  });
});

function pick(date: Date | null) {
  return date ? [date.getFullYear(), date.getMonth(), date.getDate()] : null;
}

const project: Project = { id: "p1", name: "Mobile App v2", identifier: "MAV", description: null, emoji: "📱" };
const site: Project = { id: "p2", name: "Website", identifier: "WEB", description: null, emoji: null };

const todoStatus: Status = { id: "s1", projectId: "p1", name: "Todo", color: "#60646C", group: "todo", sequence: 1000, default: true };

function assignedTo(memberId: string) {
  return { id: `a-${memberId}`, kind: "member" as const, memberId, agentId: null };
}

const myTasksInput = {
  projects: [project, site],
  tasksByProject: [
    [
      makeTask({ id: "t1", name: "Fix login", priority: "urgent", taskAssignees: [assignedTo("m1")] }),
      makeTask({ id: "t2", name: "Review copy", taskAssignees: [assignedTo("m2")] }),
      makeTask({ id: "t3", name: "Draft release notes", taskAssignees: [{ id: "a9", kind: "agent" as const, memberId: null, agentId: "bot" }] }),
    ],
    [makeTask({ id: "t4", name: "Ship landing page", taskAssignees: [assignedTo("m1")] })],
  ],
  statusesByProject: [[todoStatus], [todoStatus]],
  memberId: "m1",
};

describe("buildMyTasksRows", () => {
  it("keeps_onlyTasksAssignedToTheCaller_acrossEveryProject", () => {
    const rows = buildMyTasksRows(myTasksInput);

    expect(rows.map((row) => row.task.id)).toEqual(["t1", "t4"]);
  });

  it("tags_eachRow_withItsProject_andResolvesItsStatus", () => {
    const rows = buildMyTasksRows(myTasksInput);

    expect(rows[0].projectId).toBe("p1");
    expect(rows[0].project).toEqual({ name: "Mobile App v2", emoji: "📱" });
    expect(rows[0].status?.name).toBe("Todo");
    expect(rows[1].projectId).toBe("p2");
    expect(rows[1].status?.name).toBe("Todo");
  });

  it("narrows_byName_orPriority_whenAQueryIsGiven", () => {
    expect(buildMyTasksRows({ ...myTasksInput, query: "landing" }).map((row) => row.task.id)).toEqual(["t4"]);
    expect(buildMyTasksRows({ ...myTasksInput, query: "urgent" }).map((row) => row.task.id)).toEqual(["t1"]);
    expect(buildMyTasksRows({ ...myTasksInput, query: "nobody-owns-this" })).toEqual([]);
  });
});

describe("GroupedBoard", () => {
  const card = makeTask({ id: "t1", name: "Ship API", targetDate: new Date(2026, 8, 27).toISOString() });

  function renderBoard(onDropColumn: (task: ProjectTask, columnId: string) => void) {
    render(
      <GroupedBoard
        columns={[
          { id: "today", name: "Today", color: "#F59E0B", tasks: [card] },
          { id: "undated", name: "No due date", color: "#8B8D98", droppable: false, tasks: [] },
        ]}
        allTasks={[card]}
        statusesFor={() => []}
        onMove={vi.fn()}
        onDropColumn={onDropColumn}
        onSelect={vi.fn()}
      />,
    );
  }

  function column(name: string) {
    const heading = screen.getByRole("heading", { name });
    return heading.closest("section") as HTMLElement;
  }

  it("reports_theDroppedCard_andTheBucketItLandedIn", () => {
    const onDropColumn = vi.fn();
    renderBoard(onDropColumn);

    fireEvent.drop(column("Today"), { dataTransfer: { getData: () => card.id } });

    expect(onDropColumn).toHaveBeenCalledWith(card, "today");
  });

  it("swallows_drops_onABucketThatCannotWriteADate", () => {
    const onDropColumn = vi.fn();
    renderBoard(onDropColumn);

    fireEvent.drop(column("No due date"), { dataTransfer: { getData: () => card.id } });

    expect(onDropColumn).not.toHaveBeenCalled();
    expect(screen.getByText("No tasks")).toBeDefined();
  });
});