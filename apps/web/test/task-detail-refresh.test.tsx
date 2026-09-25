import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TaskActivity, TaskComments, useTaskDetail } from "@/features/projects";
import type { Comment, TaskActivity as ActivityEntry } from "@/lib/api";
import { countCalls, existingTask, stubRoutes } from "./support/query-hooks";
import { renderComponent } from "./support/render-component";

const SESSION_URL = "/auth/session";
const TASK_URL = "/organization/org-1/projects/p1/tasks/task-1";
const MEMBERS_URL = "/organization/org-1/members?limit=100&offset=0";
const COMMENTS_URL = "/organization/org-1/projects/p1/tasks/task-1/comments";
const ACTIVITY_URL = "/organization/org-1/projects/p1/tasks/task-1/activity";
const SESSION = { user: { id: "user-ada" } };

const comment: Comment = {
  id: "c-bob",
  taskId: "task-1",
  parentId: null,
  actorId: "user-bob",
  body: "First pass looks fine",
  createdAt: new Date(Date.now() - 30 * 60_000).toISOString(),
  updatedAt: new Date(Date.now() - 30 * 60_000).toISOString(),
};

const activity: ActivityEntry = {
  id: "a1",
  taskId: "task-1",
  actorId: "user-ada",
  verb: "updated",
  field: "statusId",
  oldValue: "status-todo",
  newValue: "In Progress",
  comment: null,
  createdAt: new Date(Date.now() - 10 * 60_000).toISOString(),
};

const taskDetail = {
  ...existingTask,
  sequenceId: 7,
  startDate: null,
  taskAssignees: [],
};

function stubPanelFetch() {
  const comments = [comment];
  const fetchMock = stubRoutes([
    { url: SESSION_URL, respond: () => SESSION },
    { url: MEMBERS_URL, respond: () => ({ members: [], total: 0 }) },
    { url: TASK_URL, respond: () => taskDetail },
    { url: COMMENTS_URL, respond: () => comments },
    {
      method: "POST",
      url: COMMENTS_URL,
      respond: (_url, init) => {
        const input = JSON.parse(String(init?.body)) as { body: string };
        const created: Comment = { ...comment, id: "c-new", body: input.body };
        comments.unshift(created);
        return created;
      },
    },
    { url: ACTIVITY_URL, respond: () => [activity] },
  ]);
  return { fetchMock, comments };
}

/** Both panel sections plus the task write, the way the real panel composes them. */
function PanelSections() {
  const detail = useTaskDetail("org-1", "p1", "task-1");
  return (
    <div>
      <TaskComments organizationId="org-1" projectId="p1" taskId="task-1" />
      <TaskActivity organizationId="org-1" projectId="p1" taskId="task-1" />
      <button type="button" onClick={() => detail.updateTask({ name: "Renamed task" })}>
        Rename task
      </button>
    </div>
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("task panel refresh", () => {
  it("createComment_whenPosted_refetchesCommentsAndActivity", async () => {
    const { fetchMock } = stubPanelFetch();
    const user = userEvent.setup();
    renderComponent(<PanelSections />);
    await screen.findByText("First pass looks fine");
    await screen.findByText("status changed to In Progress");
    expect(countCalls(fetchMock, "GET", COMMENTS_URL)).toBe(1);
    expect(countCalls(fetchMock, "GET", ACTIVITY_URL)).toBe(1);

    await user.type(screen.getByLabelText("Write a comment"), "Ship it");
    await user.click(screen.getByRole("button", { name: "Comment" }));

    await waitFor(() => expect(countCalls(fetchMock, "GET", COMMENTS_URL)).toBe(2));
    await waitFor(() => expect(countCalls(fetchMock, "GET", ACTIVITY_URL)).toBe(2));
  });

  it("updateTask_whenSaved_refetchesCommentsAndActivity", async () => {
    const { fetchMock } = stubPanelFetch();
    const user = userEvent.setup();
    renderComponent(<PanelSections />);
    await screen.findByText("First pass looks fine");
    await screen.findByText("status changed to In Progress");

    await user.click(screen.getByRole("button", { name: "Rename task" }));

    await waitFor(() => expect(countCalls(fetchMock, "PATCH", TASK_URL)).toBe(1));
    await waitFor(() => expect(countCalls(fetchMock, "GET", COMMENTS_URL)).toBe(2));
    await waitFor(() => expect(countCalls(fetchMock, "GET", ACTIVITY_URL)).toBe(2));
  });
});
