/** `?task=<id>` deep-links the task detail panel; validated once at the router boundary. */
export type TaskSearch = {
  task?: string;
};

export function parseTaskSearch(search: Record<string, unknown>): TaskSearch {
  return { task: typeof search.task === "string" && search.task !== "" ? search.task : undefined };
}
