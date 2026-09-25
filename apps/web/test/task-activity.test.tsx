import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TaskActivity } from "@/features/projects";
import type { TaskActivity as ActivityEntry } from "@/lib/api";
import { countCalls, jsonResponse, stubFetch } from "./support/query-hooks";
import { renderComponent } from "./support/render-component";

const ACTIVITY_URL = "/organization/org-1/projects/p1/tasks/task-1/activity";

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function entry(
  partial: Partial<ActivityEntry> & Pick<ActivityEntry, "id" | "verb" | "createdAt">,
): ActivityEntry {
  return {
    taskId: "task-1",
    actorId: "user-ada",
    field: null,
    oldValue: null,
    newValue: null,
    comment: null,
    ...partial,
  };
}

const timeline: ActivityEntry[] = [
  entry({ id: "a1", verb: "created", createdAt: minutesAgo(40) }),
  entry({
    id: "a2",
    verb: "updated",
    field: "statusId",
    oldValue: "status-todo",
    newValue: "In Progress",
    createdAt: minutesAgo(25),
  }),
  entry({
    id: "a3",
    verb: "updated",
    field: "dueDate",
    newValue: "Tomorrow",
    createdAt: minutesAgo(10),
  }),
  entry({
    id: "a4",
    verb: "updated",
    field: "description",
    newValue: null,
    createdAt: minutesAgo(7),
  }),
  entry({
    id: "a5",
    verb: "reassigned",
    field: "watchers",
    newValue: "ada",
    createdAt: minutesAgo(3),
  }),
  entry({ id: "a6", verb: "archived", createdAt: new Date().toISOString() }),
];

function renderActivity() {
  return renderComponent(<TaskActivity organizationId="org-1" projectId="p1" taskId="task-1" />);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TaskActivity", () => {
  it("getActivity_whenRowsLoad_rendersSentencesWithRelativeTimestamps", async () => {
    let resolveActivity: ((response: Response) => void) | undefined;
    const pendingActivity = new Promise<Response>((resolve) => {
      resolveActivity = resolve;
    });
    stubFetch((url, init) => {
      const method = init?.method ?? "GET";
      if (method === "GET" && url.endsWith(ACTIVITY_URL)) return pendingActivity;
      throw new Error(`Unexpected request: ${method} ${url}`);
    });

    const { container } = renderActivity();

    expect(container.querySelector('[data-slot="skeleton"]')).toBeInTheDocument();
    expect(screen.queryByText("No activity yet")).not.toBeInTheDocument();

    if (!resolveActivity) throw new Error("the activity request never started");
    resolveActivity(jsonResponse(timeline));

    expect(await screen.findByText("created this task")).toBeInTheDocument();
    expect(screen.getByText("status changed to In Progress")).toBeInTheDocument();
    expect(screen.getByText("due date changed to Tomorrow")).toBeInTheDocument();
    expect(screen.getByText("description cleared")).toBeInTheDocument();
    expect(screen.getByText("reassigned watchers to ada")).toBeInTheDocument();
    expect(screen.getByText("archived this task")).toBeInTheDocument();
    expect(screen.getByText("40 minutes ago")).toBeInTheDocument();
    expect(screen.getByText("just now")).toBeInTheDocument();
    expect(container.querySelector('[data-slot="skeleton"]')).not.toBeInTheDocument();
  });

  it("getActivity_whenTimelineEmpty_showsNoActivityYet", async () => {
    stubFetch((url, init) => {
      const method = init?.method ?? "GET";
      if (method === "GET" && url.endsWith(ACTIVITY_URL)) return jsonResponse([]);
      throw new Error(`Unexpected request: ${method} ${url}`);
    });
    const { container } = renderActivity();

    expect(await screen.findByText("No activity yet")).toBeInTheDocument();
    expect(container.querySelector('[data-slot="skeleton"]')).not.toBeInTheDocument();
  });

  it("getActivity_whenRequestFails_showsMessageAndRetries", async () => {
    let attempts = 0;
    const fetchMock = stubFetch((url, init) => {
      const method = init?.method ?? "GET";
      if (method !== "GET" || !url.endsWith(ACTIVITY_URL)) {
        throw new Error(`Unexpected request: ${method} ${url}`);
      }
      attempts += 1;
      return attempts === 1
        ? jsonResponse({ code: "INTERNAL_ERROR", message: "Timeline unavailable" }, 500)
        : jsonResponse(timeline);
    });
    renderActivity();

    expect(await screen.findByText("Timeline unavailable")).toBeInTheDocument();
    expect(screen.queryByText("No activity yet")).not.toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("created this task")).toBeInTheDocument();
    expect(countCalls(fetchMock, "GET", ACTIVITY_URL)).toBe(2);
    await waitFor(() => expect(screen.queryByText("Timeline unavailable")).not.toBeInTheDocument());
  });
});
