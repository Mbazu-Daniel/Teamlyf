import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TaskDetailPanel } from "@/features/projects";
import type { Comment, TaskActivity as ActivityEntry } from "@/lib/api";
import { countCalls, existingTask, stubRoutes, todo } from "./support/query-hooks";
import { renderComponent } from "./support/render-component";

const SESSION_URL = "/auth/session";
const TASK_URL = "/organization/org-1/projects/p1/tasks/task-1";
const MEMBERS_URL = "/organization/org-1/members?limit=100&offset=0";
const COMMENTS_URL = "/organization/org-1/projects/p1/tasks/task-1/comments";
const ACTIVITY_URL = "/organization/org-1/projects/p1/tasks/task-1/activity";
const SESSION = { user: { id: "user-ada" } };

const ownComment: Comment = {
  id: "c-ada",
  taskId: "task-1",
  parentId: null,
  actorId: "user-ada",
  body: "Ready to ship",
  createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
  updatedAt: new Date(Date.now() - 5 * 60_000).toISOString(),
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

function stubPanelFetch() {
  const comments = [ownComment];
  return stubRoutes([
    { url: SESSION_URL, respond: () => SESSION },
    { url: MEMBERS_URL, respond: () => ({ members: [], total: 0 }) },
    {
      url: TASK_URL,
      respond: () => ({ ...existingTask, sequenceId: 7, startDate: null, taskAssignees: [] }),
    },
    { url: COMMENTS_URL, respond: () => comments },
    {
      method: "DELETE",
      url: /\/comments\/[^/]+$/,
      respond: () => {
        const index = comments.findIndex((comment) => comment.id === "c-ada");
        if (index >= 0) comments.splice(index, 1);
        return null;
      },
    },
    { url: ACTIVITY_URL, respond: () => [activity] },
  ]);
}

function renderPanel() {
  return renderComponent(
    <TaskDetailPanel
      organizationId="org-1"
      projectId="p1"
      taskId="task-1"
      statuses={[todo]}
      onClose={vi.fn()}
    />,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TaskDetailPanel sections", () => {
  it("whenTaskSelected_mountsCommentsAndActivityInsideTheDialog", async () => {
    stubPanelFetch();
    renderPanel();

    const dialog = await screen.findByRole("dialog");
    await within(dialog).findByText("Ready to ship");

    expect(within(dialog).getByRole("heading", { name: "Comments" })).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { name: "Activity" })).toBeInTheDocument();
    expect(within(dialog).getByText("status changed to In Progress")).toBeInTheDocument();
  });

  it("whenOwnCommentDeleted_confirmsInsideThePanel_thenRemovesRow", async () => {
    const fetchMock = stubPanelFetch();
    const user = userEvent.setup();
    renderPanel();
    const dialog = await screen.findByRole("dialog");
    await within(dialog).findByText("Ready to ship");

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    const confirm = await screen.findByRole("dialog", { name: "Delete this comment?" });
    expect(within(dialog).getByText("Ready to ship")).toBeInTheDocument();

    await user.click(within(confirm).getByRole("button", { name: "Delete comment" }));

    await waitFor(() => expect(countCalls(fetchMock, "DELETE", `${COMMENTS_URL}/c-ada`)).toBe(1));
    await waitFor(() =>
      expect(within(dialog).queryByText("Ready to ship")).not.toBeInTheDocument(),
    );
  });
});
