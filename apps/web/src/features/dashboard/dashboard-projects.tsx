import { Link } from "@tanstack/react-router";
import { IconLayoutKanban } from "@tabler/icons-react";
import { DashboardPanel } from "./dashboard-panel";
import type { ProjectRollup } from "./dashboard-metrics";

/**
 * Project progress is counted from tasks: a project row carries no status or
 * progress column, so its tasks and their status categories are the signal.
 */
export function DashboardProjects({
  organizationSlug,
  rollups,
  loading,
}: {
  organizationSlug: string;
  rollups: readonly ProjectRollup[];
  loading: boolean;
}) {
  const visible = rollups.slice(0, 5);

  return (
    <DashboardPanel
      title="Projects"
      description="Completed tasks out of all tasks."
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
        <p className="text-sm text-muted-foreground">Loading projects…</p>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-10 text-center">
          <IconLayoutKanban className="size-5 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium">No projects yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Create a project to start tracking tasks.</p>
        </div>
      ) : (
        <ul className="space-y-1">
          {visible.map((rollup) => (
            <li key={rollup.project.id}>
              <Link
                to="/$organizationSlug/projects/$projectId"
                params={{ organizationSlug, projectId: rollup.project.identifier }}
                className="group flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/60"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium group-hover:text-primary">
                    {rollup.project.emoji ? `${rollup.project.emoji} ` : ""}
                    {rollup.project.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {rollup.total ? `${rollup.done} of ${rollup.total} done` : "No tasks yet"}
                  </span>
                </span>
                <span className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  {rollup.percent}%
                </span>
                <span
                  className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={rollup.percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${rollup.project.name} progress`}
                >
                  <span className="block h-full rounded-full bg-primary" style={{ width: `${rollup.percent}%` }} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardPanel>
  );
}
