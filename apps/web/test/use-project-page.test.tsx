import { act, cleanup, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useProjectPage } from "@/features/projects";
import type { ProjectTask } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import {
  TASKS_URL,
  countCalls,
  done,
  existingTask,
  jsonResponse,
  project,
  renderWithQueryClient,
  stubRoutes,
  submitEvent,
  todo,
  type Route,
} from "./support/query-hooks";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function stubDetailFetch(options: { createdTask?: ProjectTask; patchResponse?: Promise<Response> }) {
  const tasks = [existingTask];
  return stubRoutes([
    ...createTaskRoute(tasks, options),
    ...patchTaskRoute(tasks, options),
    { url: TASKS_URL, respond: () => tasks },
    { url: "/projects/p1/statuses", respond: () => [todo, done] },
    { url: "/projects/p1", respond: () => project },
  ]);
}

/** The create endpoint only exists for the test that asks for one. */
function createTaskRoute(
  tasks: ProjectTask[],
  options: { createdTask?: ProjectTask },
): Route[] {
  if (!options.createdTask) return [];
  return [
    {
      method: "POST",
      url: TASKS_URL,
      respond: () => {
        tasks.push(options.createdTask!);
        return options.createdTask;
      },
    },
  ];
}

/** The patch endpoint only exists for the test that supplies its response. */
function patchTaskRoute(
  tasks: ProjectTask[],
  options: { patchResponse?: Promise<Response> },
): Route[] {
  if (!options.patchResponse) return [];
  return [
    {
      method: "PATCH",
      url: "/tasks/task-1",
      respond: (_url, init) => {
        const patch = JSON.parse(String(init?.body)) as { statusId?: string };
        return options.patchResponse!.then((response) => {
          if (response.ok && patch.statusId) {
            tasks[0] = { ...tasks[0]!, statusId: patch.statusId };
          }
          return response;
        });
      },
    },
  ];
}

async function renderDetail(options: Parameters<typeof stubDetailFetch>[0]) {
  const fetchMock = stubDetailFetch(options);
  const rendered = renderWithQueryClient(() => useProjectPage("org-1", "p1"));
  await waitFor(() => expect(rendered.result.current.project).not.toBeNull());
  await waitFor(() => expect(rendered.result.current.tasks).toHaveLength(1));
  return { fetchMock, ...rendered };
}

describe("useProjectPage", () => {
  it("createTask_whenSubmitted_postsTaskWithFirstStatus_andRefetchesTasks", async () => {
    const created: ProjectTask = {
      id: "task-2",
      sequenceId: 2,
      name: "Write tests",
      description: null,
      priority: "none",
      statusId: todo.id,
      startDate: null,
      targetDate: null,
    };
    const { fetchMock, queryClient, result } = await renderDetail({ createdTask: created });
    expect(result.current.statusId).toBe(todo.id);
    expect(result.current.statuses.map((item) => item.id)).toEqual([todo.id, done.id]);

    act(() => {
      result.current.setName("  Write tests  ");
    });
    act(() => {
      result.current.createTask(submitEvent());
    });

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(TASKS_URL),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ name: "Write tests", statusId: todo.id }),
        }),
      ),
    );
    await waitFor(() => expect(result.current.name).toBe(""));
    await waitFor(() => expect(countCalls(fetchMock, "GET", TASKS_URL)).toBe(2));
    expect(queryClient.getQueryData(queryKeys.tasks("org-1", "p1"))).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  it("moveTask_whenStatusChanges_appliesOptimistically_thenRefetchesAfterServer", async () => {
    let resolvePatch: ((response: Response) => void) | undefined;
    const patchResponse = new Promise<Response>((resolve) => {
      resolvePatch = resolve;
    });
    const { fetchMock, queryClient, result } = await renderDetail({ patchResponse });

    act(() => {
      result.current.moveTask(existingTask, done.id);
    });

    // The board reflects the move while the server has not answered yet.
    await waitFor(() => expect(result.current.tasks[0]?.statusId).toBe(done.id));
    const cachedTasks = queryClient.getQueryData<ProjectTask[]>(queryKeys.tasks("org-1", "p1"));
    expect(cachedTasks?.[0]?.statusId).toBe(done.id);
    expect(countCalls(fetchMock, "GET", TASKS_URL)).toBe(1);

    if (!resolvePatch) throw new Error("moveTask never reached the server");
    resolvePatch(jsonResponse({ ...existingTask, statusId: done.id }));

    await waitFor(() => expect(countCalls(fetchMock, "GET", TASKS_URL)).toBe(2));
    expect(result.current.tasks[0]?.statusId).toBe(done.id);
    expect(result.current.error).toBeNull();
  });

  it("moveTask_whenStatusUnchanged_sendsNoRequest", async () => {
    const { fetchMock, result } = await renderDetail({});

    act(() => {
      result.current.moveTask(existingTask, existingTask.statusId);
    });
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(countCalls(fetchMock, "PATCH", "/tasks/task-1")).toBe(0);
    expect(result.current.tasks[0]?.statusId).toBe(existingTask.statusId);
  });

  it("moveTask_whenServerRejects_revertsTask_andShowsMessage", async () => {
    const patchResponse = Promise.resolve(
      jsonResponse({ code: "FORBIDDEN", message: "You do not have permission" }, 403),
    );
    const { fetchMock, result } = await renderDetail({ patchResponse });

    act(() => {
      result.current.moveTask(existingTask, done.id);
    });

    await waitFor(() => expect(result.current.error).toBe("You do not have permission"));
    expect(countCalls(fetchMock, "PATCH", "/tasks/task-1")).toBe(1);
    await waitFor(() => expect(result.current.tasks[0]?.statusId).toBe(existingTask.statusId));
  });
});
