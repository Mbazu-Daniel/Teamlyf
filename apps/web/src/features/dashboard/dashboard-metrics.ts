import type { Project, ProjectTask, Status } from "@/lib/api";
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
function statusGroupOf(row: TaskRow): StatusGroup {
  const group = row.status?.group;
  return group && group in STATUS_GROUP_META ? (group as StatusGroup) : "other";
}

/** Done and cancelled work is off the books: it neither nags nor counts as open. */
function isOpenWork(row: TaskRow): boolean {
  const group = statusGroupOf(row);
  return group !== "done" && group !== "cancelled";
}

function isAssignedTo(row: TaskRow, memberId: string | undefined): boolean {
  if (!memberId) return false;
  return row.task.taskAssignees?.some((assignee) => assignee.kind === "member" && assignee.memberId === memberId) ?? false;
}

export type DistributionSlice = Readonly<{
  group: StatusGroup;
  label: string;
  color: string;
  count: number;
  percent: number;
}>;

export type ProjectRollup = Readonly<{
  project: Project;
  total: number;
  done: number;
  percent: number;
}>;

export type KpiTile = Readonly<{
  label: string;
  value: number;
  caption: string;
  tone?: string;
}>;

export type WeekThroughput = Readonly<{
  weekStart: string;
  label: string;
  created: number;
  completed: number;
}>;

export function statusDistribution(rows: readonly TaskRow[]): DistributionSlice[] {
  const counts = new Map<StatusGroup, number>(STATUS_GROUP_ORDER.map((group) => [group, 0]));
  for (const row of rows) counts.set(statusGroupOf(row), (counts.get(statusGroupOf(row)) ?? 0) + 1);
  const total = rows.length;
  return STATUS_GROUP_ORDER.map((group) => ({
    group,
    label: STATUS_GROUP_META[group].label,
    color: STATUS_GROUP_META[group].color,
    count: counts.get(group) ?? 0,
    percent: total ? Math.round(((counts.get(group) ?? 0) / total) * 100) : 0,
  })).filter((slice) => slice.count > 0);
}

export function projectRollups(projects: readonly Project[], rows: readonly TaskRow[]): ProjectRollup[] {
  return projects.map((project) => {
    const projectRows = rows.filter((row) => row.projectId === project.id);
    const done = projectRows.filter((row) => statusGroupOf(row) === "done").length;
    return {
      project,
      total: projectRows.length,
      done,
      percent: projectRows.length ? Math.round((done / projectRows.length) * 100) : 0,
    };
  }).sort((left, right) => right.percent - left.percent || left.project.name.localeCompare(right.project.name));
}

export function kpiTiles(
  projects: readonly Project[],
  rows: readonly TaskRow[],
  context: { memberId?: string },
): KpiTile[] {
  const open = rows.filter(isOpenWork);
  const mine = open.filter((row) => isAssignedTo(row, context.memberId));
  const overdue = mine.filter((row) => dateGroupOf(row.task) === "overdue");
  const today = mine.filter((row) => dateGroupOf(row.task) === "today");
  const completed = rows.filter((row) => statusGroupOf(row) === "done");
  return [
    { label: "Active projects", value: projects.length, caption: projects.length === 1 ? "1 project in workspace" : "Across your workspace" },
    { label: "Open work", value: open.length, caption: "Tasks not yet complete" },
    { label: "Due today", value: today.length, caption: overdue.length ? `${overdue.length} overdue` : "Assigned to you", tone: overdue.length ? "text-destructive" : undefined },
    { label: "Completed", value: completed.length, caption: rows.length ? `${Math.round((completed.length / rows.length) * 100)}% of all tasks` : "No tasks yet", tone: "text-emerald-600 dark:text-emerald-400" },
  ];
}

function startOfWeek(value: Date): Date {
  const date = new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  return date;
}

function weekKey(value: Date): string {
  return `${value.getFullYear()}-${value.getMonth()}-${value.getDate()}`;
}

export function weeklyThroughput(rows: readonly TaskRow[], now = new Date()): WeekThroughput[] {
  const weeks = Array.from({ length: 6 }, (_, index) => {
    const start = startOfWeek(now);
    start.setDate(start.getDate() - (5 - index) * 7);
    return { start, created: 0, completed: 0 };
  });
  const byWeek = new Map(weeks.map((week) => [weekKey(week.start), week]));
  for (const row of rows) {
    for (const [kind, value] of [["created", row.task.createdAt], ["completed", row.task.completedAt]] as const) {
      if (!value) continue;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) continue;
      const bucket = byWeek.get(weekKey(startOfWeek(date)));
      if (bucket) bucket[kind] += 1;
    }
  }
  return weeks.map((week) => ({
    weekStart: week.start.toISOString(),
    label: week.start.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    created: week.created,
    completed: week.completed,
  }));
}

export function throughputSummary(weeks: readonly WeekThroughput[]): string {
  const created = weeks.reduce((total, week) => total + week.created, 0);
  const completed = weeks.reduce((total, week) => total + week.completed, 0);
  if (!created && !completed) return "No task activity has been recorded in the last six weeks.";
  return `${completed} completed and ${created} created in the last six weeks.`;
}

export function todaysRows(rows: readonly TaskRow[], memberId: string | undefined): TaskRow[] {
  return rows.filter((row) => isOpenWork(row) && isAssignedTo(row, memberId) && ["overdue", "today"].includes(dateGroupOf(row.task)))
    .sort((left, right) => (left.task.targetDate ?? "").localeCompare(right.task.targetDate ?? ""));
}

export function dueSoonRows(rows: readonly TaskRow[], now = new Date()): TaskRow[] {
  const limit = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14).getTime();
  return rows.filter((row) => {
    if (!isOpenWork(row) || !row.task.targetDate) return false;
    const due = new Date(row.task.targetDate).getTime();
    return !Number.isNaN(due) && due >= new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() && due <= limit;
  }).sort((left, right) => (left.task.targetDate ?? "").localeCompare(right.task.targetDate ?? "")).slice(0, 6);
}
