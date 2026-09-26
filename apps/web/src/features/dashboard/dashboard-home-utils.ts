import type { Project } from "@/lib/api";

export function projectProgress(project: Project) {
  const total = Number((project as Project & { totalTasks?: number }).totalTasks ?? 0);
  const done = Number((project as Project & { completedTasks?: number }).completedTasks ?? 0);
  const progress = (project as Project & { progress?: number }).progress;
  return { total, done, percent: typeof progress === "number" ? progress : total ? Math.round((done / total) * 100) : 0 };
}

export const projectStatus = (status?: string | null) => ({
  label: status?.replaceAll("_"," ") || "Planned",
  className: "rounded-[8px] border border-border bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground",
});