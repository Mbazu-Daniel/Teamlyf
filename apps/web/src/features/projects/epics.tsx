import { Link } from "@tanstack/react-router";
import { IconLayoutKanban, IconList, IconRunSprint } from "@tabler/icons-react";
import { MilestonesSection } from "./milestones";
import { useProjectPage } from "./use-project-page";
import { MutedMessage } from "./feedback";
import { cn } from "@/lib/utils";

export function EpicsPage({
  organizationId,
  projectSlug: slug,
  organizationSlug,
}: {
  organizationId: string;
  projectSlug: string;
  organizationSlug: string;
}) {
  const state = useProjectPage(organizationId, slug);
  const project = state.project;

  if (!project) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-sm text-muted-foreground">{state.error ?? "Loading project…"}</p>
      </main>
    );
  }

  return (
    <div className="mx-auto h-full min-h-0 w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
      <div className="flex min-h-0 w-full flex-col overflow-hidden rounded-[16px] border border-border/70 bg-card">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-[-0.015em]">
              {project.name} · Modules
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Large pieces of work, each holding many tasks. Use a sprint for what the team is doing
              right now.
            </p>
          </div>
          <ProjectSectionNav organizationSlug={organizationSlug} slug={slug} />
        </header>

        <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {state.error ? (
            <MutedMessage message={state.error} />
          ) : (
            <MilestonesSection
              milestones={state.milestones}
              tasks={state.tasks}
              loading={state.milestonesLoading}
              statuses={state.statuses}
              createMilestone={state.createMilestone}
              updateMilestone={state.updateMilestone}
              deleteMilestone={state.deleteMilestone}
              addTaskToMilestone={state.addTaskToMilestone}
              removeTaskFromMilestone={state.removeTaskFromMilestone}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export function ProjectSectionNav({
  organizationSlug,
  slug,
  active = "tasks",
}: {
  organizationSlug: string;
  slug: string;
  active?: "tasks" | "epics" | "sprints";
}) {
  const links = [
    {
      key: "tasks",
      to: "/$organizationSlug/projects/$projectId/tasks",
      label: "Tasks",
      Icon: IconList,
    },
    {
      key: "epics",
      to: "/$organizationSlug/projects/$projectId/epics",
      label: "Modules",
      Icon: IconLayoutKanban,
    },
    {
      key: "sprints",
      to: "/$organizationSlug/projects/$projectId/sprints",
      label: "Sprints",
      Icon: IconRunSprint,
    },
  ] as const;

  return (
    <div className="flex h-control items-center rounded-[10px] bg-muted/75 p-1">
      {links.map(({ key, to, label, Icon }) => (
        <Link
          key={key}
          to={to}
          params={{ organizationSlug, projectId: slug }}
          className={cn(
            "h-control-inner rounded-[8px] px-3 text-xs font-semibold transition-colors",
            active === key
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="mr-1.5 inline size-3.5" />
          {label}
        </Link>
      ))}
    </div>
  );
}
