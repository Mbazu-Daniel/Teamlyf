/** `?task=<task-name-slug>` deep-links the task detail panel; IDs remain accepted for backwards compatibility. */
export type TaskSearch = {
  task?: string;
};

export function parseTaskSearch(search: Record<string, unknown>): TaskSearch {
  return { task: typeof search.task === "string" && search.task !== "" ? search.task : undefined };
}
