import { describe, expect, it } from "vitest";
import { noteDocument, noteText } from "@/features/notes/rich-content";
import { ALL_ASSIGNEES, buildMyTasksRows } from "@/features/projects/use-my-tasks";
import type { ProjectTask } from "@/lib/api";

describe("note content", () => {
  it("preserves legacy text without interpreting HTML", () => {
    const content = "<script>alert(1)</script>\nSecond line";
    expect(noteDocument(content).content?.[0]?.content?.[0]?.text).toBe(
      "<script>alert(1)</script>",
    );
    expect(noteText(content)).toBe(content);
  });
  it("extracts readable text from stored rich-text JSON", () => {
    expect(
      noteText(
        'teamlyf-rich-v1:{"type":"doc","content":[{"type":"heading","content":[{"type":"text","text":"Decision"}]}]}',
      ),
    ).toBe("Decision");
  });
});

describe("workspace task scope", () => {
  const task: ProjectTask = {
    id: "t1",
    name: "Shared task",
    sequenceId: 1,
    description: null,
    priority: "high",
    statusId: "s1",
    taskAssignees: [],
    startDate: null,
    targetDate: null,
  };
  const input = {
    projects: [{ id: "p1", name: "Project", identifier: "P", description: null, emoji: null }],
    tasksByProject: [[task]],
    statusesByProject: [[]],
    memberId: "me",
  };
  it("retains the personal default and includes unassigned tasks only when everyone is selected", () => {
    expect(buildMyTasksRows(input)).toEqual([]);
    expect(buildMyTasksRows({ ...input, assigneeId: ALL_ASSIGNEES })).toHaveLength(1);
  });
  it("combines project, text and priority filters", () => {
    expect(buildMyTasksRows({ ...input, assigneeId: ALL_ASSIGNEES, priority: "low" })).toEqual([]);
    expect(
      buildMyTasksRows({ ...input, assigneeId: ALL_ASSIGNEES, projectFilter: "other" }),
    ).toEqual([]);
    expect(
      buildMyTasksRows({
        ...input,
        assigneeId: ALL_ASSIGNEES,
        priority: "high",
        query: "shared",
        projectFilter: "p1",
      }),
    ).toHaveLength(1);
  });
});
