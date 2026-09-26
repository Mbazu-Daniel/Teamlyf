import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { FormEvent, ReactNode } from "react";
import { vi } from "vitest";
import type { Project, ProjectTask, Status } from "@/lib/api";

export const project: Project = {
  id: "p1",
  name: "Website",
  identifier: "WEB",
  description: null,
  emoji: "🚀",
};

export const todo: Status = {
  id: "status-todo",
  projectId: "p1",
  name: "Todo",
  color: "#60646C",
  group: "todo",
  sequence: 1000,
  default: true,
};

export const done: Status = {
  id: "status-done",
  projectId: "p1",
  name: "Done",
  color: "#46A758",
  group: "done",
  sequence: 2000,
  default: false,
};

export const existingTask: ProjectTask = {
  id: "task-1",
  sequenceId: 1,
  name: "Design the header",
  description: null,
  priority: "high",
  statusId: todo.id,
  startDate: null,
  targetDate: null,
};

export const PROJECTS_URL = "/organization/org-1/projects";
export const TASKS_URL = "/organization/org-1/projects/p1/tasks";

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function stubFetch(
  handler: (url: string, init: RequestInit | undefined) => Response | Promise<Response>,
) {
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) =>
    handler(String(input), init),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

export type FetchMock = ReturnType<typeof stubFetch>;

/** One endpoint a stubbed fetch knows how to answer. */
export type Route = {
  /** Defaults to GET. */
  method?: string;
  /** A url suffix, or a pattern when the path has a variable tail. */
  url: string | RegExp;
  /**
   * Runs per call with the request, so a test can read the body or mutate the
   * array it hands back. A bare value is JSON-encoded; return a Response (or a
   * promise of one) when the test needs to control status or failure.
   */
  respond: (url: string, init?: RequestInit) => unknown;
};

function matches(url: string, pattern: string | RegExp) {
  return typeof pattern === "string" ? url.endsWith(pattern) : pattern.test(url);
}

function isThenable(value: unknown): value is Promise<unknown> {
  return typeof (value as Promise<unknown> | undefined)?.then === "function";
}

/** A route's return value becomes a Response, however the test produced it. */
function toResponse(result: unknown): Response | Promise<Response> {
  if (result instanceof Response) return result;
  if (isThenable(result)) return Promise.resolve(result).then(toResponse);
  return jsonResponse(result);
}

/**
 * A fetch stub driven by a route table, so a test reads as the list of
 * endpoints the component under test is allowed to touch. Anything else throws,
 * which is what makes an unexpected request a test failure rather than a hang.
 */
export function stubRoutes(routes: Route[]) {
  return stubFetch((url, init) => {
    const method = init?.method ?? "GET";
    const route = routes.find(
      (candidate) => (candidate.method ?? "GET") === method && matches(url, candidate.url),
    );
    if (!route) throw new Error(`Unexpected request: ${method} ${url}`);
    return toResponse(route.respond(url, init));
  });
}

export function countCalls(fetchMock: FetchMock, method: string, urlSuffix: string) {
  return fetchMock.mock.calls.filter(
    ([input, init]) =>
      (init?.method ?? "GET") === method && String(input).endsWith(urlSuffix),
  ).length;
}

export function submitEvent() {
  return { preventDefault: () => {} } as FormEvent;
}

export function renderWithQueryClient<T>(useHook: () => T) {
  const queryClient = new QueryClient();
  return {
    queryClient,
    ...renderHook(useHook, {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    }),
  };
}
