/**
 * `?task=<task-id>` deep-links the task detail panel; IDs remain accepted for
 * backwards compatibility.
 *
 * `?view=board|list` is the active tasks view. It lives in the URL so a view is
 * a link somebody else can open — the sidebar's Board/List children and the
 * segmented control both write to it.
 */
export type TaskSearch = {
  task?: string;
  view?: TaskView;
};

export type TaskView = "board" | "list";

export function parseTaskSearch(search: Record<string, unknown>): TaskSearch {
  return {
    task: typeof search.task === "string" && search.task !== "" ? search.task : undefined,
    view: search.view === "list" ? "list" : search.view === "board" ? "board" : undefined,
  };
}
