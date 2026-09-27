import { Link } from "@tanstack/react-router";
import { IconCalendarUp } from "@tabler/icons-react";
import { DashboardPanel } from "./dashboard-panel";
import { DashboardTaskRow } from "./dashboard-task-row";
import type { TaskRow } from "./dashboard-metrics";

/** The next two weeks of dated work across every visible project. */
export function DashboardDueSoon({
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
      title="Due soon"
      description="Tasks with a date in the next 14 days."
      action={
        <Link
          to="/$organizationSlug/projects"
          params={{ organizationSlug }}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          View all
        </Link>
      }
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading tasks…</p>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-8 text-center">
          <IconCalendarUp className="size-5 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium">Nothing due in the next two weeks</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Dated tasks across your projects show up here as they approach.
          </p>
        </div>
      ) : (
        <ul className="-mx-2 space-y-0.5">
          {rows.map((row) => (
            <li key={row.task.id}>
              <DashboardTaskRow row={row} organizationSlug={organizationSlug} href="project" />
            </li>
          ))}
        </ul>
      )}
    </DashboardPanel>
  );
}
