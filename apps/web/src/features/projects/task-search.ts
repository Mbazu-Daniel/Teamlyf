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
