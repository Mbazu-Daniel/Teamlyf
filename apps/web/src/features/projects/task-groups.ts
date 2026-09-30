import type { ProjectTask, Status } from "@/lib/api";

export type DateGroupId = "overdue" | "today" | "upcoming" | "undated";

const DATE_GROUP_IDS: readonly DateGroupId[] = ["overdue", "today", "upcoming", "undated"];

export const DATE_GROUP_META: Record<
  DateGroupId,
  { label: string; labelClassName: string; color: string; droppable: boolean }
> = {
  overdue: {
    label: "Overdue",
    labelClassName: "text-destructive",
    color: "#EF4444",
    droppable: true,
  },
  today: { label: "Today", labelClassName: "text-amber-500", color: "#F59E0B", droppable: true },
  upcoming: {
    label: "Upcoming",
    labelClassName: "text-foreground",
    color: "#3B82F6",
    droppable: true,
  },
  undated: {
    label: "No due date",
    labelClassName: "text-muted-foreground",
    color: "#8B8D98",
    droppable: false,
  },
};

export type TaskListRow = Readonly<{
  task: ProjectTask;
  status?: Status;
  project?: { name: string; emoji?: string | null };
}>;

export type TaskListGroup = Readonly<{
  id: string;
  label?: string;
  labelClassName?: string;
  rows: readonly TaskListRow[];
}>;

export type DateGroup = Readonly<{
  id: DateGroupId;
  label: string;
  labelClassName: string;
  rows: readonly TaskListRow[];
}>;

function startOfLocalDay(value: Date): number {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
}

export function dateGroupOf(task: ProjectTask, today = new Date()): DateGroupId {
  if (!task.targetDate) return "undated";
  const due = new Date(task.targetDate);
  if (Number.isNaN(due.getTime())) return "undated";
  const dueDay = startOfLocalDay(due);
  const todayDay = startOfLocalDay(today);
  if (dueDay < todayDay) return "overdue";
  if (dueDay === todayDay) return "today";
  return "upcoming";
}

export function dueTone(task: ProjectTask, today = new Date()): string {
  const group = dateGroupOf(task, today);
  if (group === "overdue") return "text-destructive";
  if (group === "today") return "text-amber-500";
  return "text-muted-foreground";
}

export function groupRowsByDate(rows: readonly TaskListRow[], today = new Date()): DateGroup[] {
  const buckets = new Map<DateGroupId, TaskListRow[]>(DATE_GROUP_IDS.map((id) => [id, []]));
  for (const row of rows) buckets.get(dateGroupOf(row.task, today))?.push(row);
  return DATE_GROUP_IDS.map((id) => ({
    id,
    label: DATE_GROUP_META[id].label,
    labelClassName: DATE_GROUP_META[id].labelClassName,
    rows: buckets.get(id) ?? [],
  }));
}

export function isDateGroupId(value: string): value is DateGroupId {
  return (DATE_GROUP_IDS as readonly string[]).includes(value);
}

export function rescheduleDateFor(id: DateGroupId, today = new Date()): Date | null {
  if (!DATE_GROUP_META[id].droppable) return null;
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (id === "overdue") date.setDate(date.getDate() - 1);
  if (id === "upcoming") date.setDate(date.getDate() + 1);
  return date;
}
