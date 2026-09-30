import { Link } from "@tanstack/react-router";
import { dueTone } from "../projects/task-groups";
import { cn } from "@/lib/utils";
import type { TaskRow } from "./dashboard-metrics";

export function DashboardTaskRow({
  row,
  organizationSlug,
  href,
}: {
  row: TaskRow;
  organizationSlug: string;
  href: "my-tasks" | "project";
}) {
  const due = row.task.targetDate
    ? new Date(row.task.targetDate).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
      })
    : "No due date";

  const content = (
    <>
      <span
        className="mt-1.5 size-2 shrink-0 rounded-full"
        style={{ backgroundColor: row.status?.color ?? "#8B8D98" }}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{row.task.name}</span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {row.projectName}
          {row.status ? ` · ${row.status.name}` : ""}
        </span>
      </span>
      <span className={cn("shrink-0 text-xs tabular-nums", dueTone(row.task))}>{due}</span>
    </>
  );

  const className = "flex items-start gap-2.5 rounded-lg px-2 py-2 hover:bg-muted/60";

  return href === "my-tasks" ? (
    <Link
      to="/$organizationSlug/tasks"
      params={{ organizationSlug }}
      search={{ task: row.task.id }}
      className={className}
    >
      {content}
    </Link>
  ) : (
    <Link
      to="/$organizationSlug/projects/$projectId/tasks"
      params={{ organizationSlug, projectId: row.projectSlug }}
      search={{ task: row.task.id }}
      className={className}
    >
      {content}
    </Link>
  );
}
