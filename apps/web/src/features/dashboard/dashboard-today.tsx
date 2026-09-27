import { Link } from "@tanstack/react-router";
import { IconCalendarOff } from "@tabler/icons-react";
import { DashboardPanel } from "./dashboard-panel";
import { DashboardTaskRow } from "./dashboard-task-row";
import type { TaskRow } from "./dashboard-metrics";

/** What the signed-in member owes today, plus anything that slipped past a date. */
export function DashboardToday({
  organizationSlug,
  rows,
  loading,
}: {
  organizationSlug: string;
  rows: readonly TaskRow[];
  loading: boolean;
}) {
  return (
    <DashboardPanel
      title="Today"
      description="Assigned to you, due today or overdue."
      action={
        <Link
          to="/$organizationSlug/tasks"
          params={{ organizationSlug }}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          All my tasks
        </Link>
      }
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading your tasks…</p>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-8 text-center">
          <IconCalendarOff className="size-5 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium">Nothing due today</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Work assigned to you with a date of today or earlier appears here.
          </p>
        </div>
      ) : (
        <ul className="-mx-2 space-y-0.5">
          {rows.map((row) => (
            <li key={row.task.id}>
              <DashboardTaskRow row={row} organizationSlug={organizationSlug} href="my-tasks" />
            </li>
          ))}
        </ul>
      )}
    </DashboardPanel>
  );
}
