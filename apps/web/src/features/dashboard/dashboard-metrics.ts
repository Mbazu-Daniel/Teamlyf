import type { Department, Project, ProjectTask, Status } from "@/lib/api";
import { dateGroupOf } from "../projects/task-groups";

/**
 * The dashboard answers "how is this workspace doing" from tasks and their
 * status categories, never from a field on the project row: a project has no
 * status column, so task rollups are the only honest source of health.
 *
 * Every function here is pure and takes `today` as an argument, so a test can
 * pin the date instead of depending on the clock.
 */

export type TaskRow = Readonly<{
  task: ProjectTask;
  status?: Status;
  projectId: string;
  /** The project identifier — the slug every project route links by. */
  projectSlug: string;
  projectName: string;
  projectEmoji?: string | null;
}>;

type BuildRowsInput = {
  projects: readonly Project[];
  tasksByProject: readonly (readonly ProjectTask[] | undefined)[];
  statusesByProject: readonly (readonly Status[] | undefined)[];
};

/** Every task of every project, tagged with its project and resolved status. */
export function buildWorkspaceRows({ projects, tasksByProject, statusesByProject }: BuildRowsInput): TaskRow[] {
  const rows: TaskRow[] = [];
  projects.forEach((project, index) => {
    const statusById = new Map((statusesByProject[index] ?? []).map((item) => [item.id, item]));
    for (const task of tasksByProject[index] ?? []) {
      rows.push({
        task,
        status: statusById.get(task.statusId),
        projectId: project.id,
        projectSlug: project.identifier,
        projectName: project.name,
        projectEmoji: project.emoji,
      });
    }
  });
  return rows;
}

export type StatusGroup = "backlog" | "todo" | "in_progress" | "done" | "cancelled" | "other";

/** Order and palette for the distribution bar — a status name never changes a bucket. */
const STATUS_GROUP_META: Record<StatusGroup, { label: string; color: string }> = {
  backlog: { label: "Backlog", color: "#94A3B8" },
  todo: { label: "To do", color: "#64748B" },
  in_progress: { label: "In progress", color: "#F59E0B" },
  done: { label: "Completed", color: "#22C55E" },
  cancelled: { label: "Cancelled", color: "#CBD5E1" },
  other: { label: "Other", color: "#A78BFA" },
};

const STATUS_GROUP_ORDER: readonly StatusGroup[] = [
  "backlog",
  "todo",
  "in_progress",
  "done",
  "cancelled",
  "other",
];

/** A custom status with an unknown `group` is still counted, under "Other". */
export function statusGroupOf(row: TaskRow): StatusGroup {
  const group = row.status?.group;
  return group && group in STATUS_GROUP_META ? (group as StatusGroup) : "other";
}

/** Done and cancelled work is off the books: it neither nags nor counts as open. */
export function isOpenWork(row: TaskRow): boolean {
  const group = statusGroupOf(row);
  return group !== "done" && group !== "cancelled";
}

export function isAssignedTo(row: TaskRow, memberId: string | undefined): boolean {
  if (!memberId) return false;
  return row.task.taskAssignees?.some((assignee) => assignee.kind === "member" && assignee.memberId === memberId) ?? false;
}
