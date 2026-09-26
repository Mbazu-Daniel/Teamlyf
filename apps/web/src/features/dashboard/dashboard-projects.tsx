import { Link } from "@tanstack/react-router";
import type { Project } from "@/lib/api";
import { projectProgress, projectStatus } from "./dashboard-home-utils";
import { DashboardPanel } from "./dashboard-panel";

export function DashboardProjects({ organizationSlug, projects }: { organizationSlug: string; projects: Project[] }) {
  return (
    <DashboardPanel
      title="Projects"
      description="Progress from completed vs total tasks"
      action={<Link to="/$organizationSlug/projects" params={{ organizationSlug }} className="text-sm font-medium text-primary underline-offset-4 hover:underline">View all</Link>}
    >
      {projects.length ? (
        <ul className="space-y-3">
          {projects.slice(0, 4).map((project) => {
            const progress = projectProgress(project);
            const status = projectStatus(project.status);
            return (
              <li key={project.id}>
                <Link
                  to="/$organizationSlug/projects/$projectId"
                  params={{ organizationSlug, projectId: project.identifier }}
                  className="group block rounded-[12px] border border-border/60 px-4 py-3.5 transition-colors hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold tracking-[-0.02em] group-hover:text-primary">{project.name}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={status.className}>{status.label}</span>
                        <span className="text-xs text-muted-foreground">{progress.total ? `${progress.done}/${progress.total} tasks` : "No tasks yet"}</span>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-semibold tabular-nums">{progress.total ? `${progress.percent}%` : "—"}</span>
                  </div>
                  {progress.total ? (
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100} aria-label={`${project.name} progress`}>
                      <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }} />
                    </div>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-[12px] border border-dashed border-border px-5 py-12 text-center">
          <p className="text-sm font-medium">No projects yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Create a project to track task progress.</p>
        </div>
      )}
    </DashboardPanel>
  );
}
