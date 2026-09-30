import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { IconCalendar, IconRunSprint, IconTarget, IconTrash } from "@tabler/icons-react";
import { projectsApi, statusesApi, type ProjectTask } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { client } from "@/lib/api/client";
import {
  PageEmptyState,
  pageInput,
  pagePrimaryAction,
  pageSecondaryAction,
} from "@/components/workspace/page-layout";
import {
  WorkflowError,
  WorkflowField,
  WorkflowSheet,
  WorkflowSubmit,
  useWorkflowMutation,
} from "@/components/workspace/workflow";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useProjectPage } from "./use-project-page";
import { ProjectSectionNav } from "./epics";
import { cn } from "@/lib/utils";

type Sprint = {
  id: string;
  name: string;
  goal: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
};

export function SprintsPage({
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
  const projectId = project?.id ?? "";
  const path = `/organization/${organizationId}/projects/${projectId}/sprints`;
  const key = ["sprints", organizationId, projectId];
  const query = useQuery({
    queryKey: key,
    queryFn: () => client.request<Sprint[]>(path),
    enabled: Boolean(projectId),
    retry: false,
  });
  const [editing, setEditing] = useState<Sprint | "new" | null>(null);
  const [tasksFor, setTasksFor] = useState<Sprint | null>(null);
  const mutation = useWorkflowMutation([key]);

  if (!project) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-sm text-muted-foreground">{state.error ?? "Loading project…"}</p>
      </main>
    );
  }

  const sprints = query.data ?? [];
  const active = sprints.find((sprint) => sprint.status === "active");

  return (
    <div className="mx-auto h-full min-h-0 w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
      <div className="flex min-h-0 w-full flex-col overflow-hidden rounded-[16px] border border-border/70 bg-card">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-[-0.015em]">
              {project.name} · Sprints
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Short cycles with a stated goal. Epics hold the larger work a sprint rolls up into.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ProjectSectionNav organizationSlug={organizationSlug} slug={slug} active="sprints" />
            <button className={pagePrimaryAction} onClick={() => setEditing("new")}>
              New sprint
            </button>
          </div>
        </header>

        <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          <WorkflowError error={query.error || mutation.error} />
          {query.isPending && <p className="text-sm text-muted-foreground">Loading sprints…</p>}

          {query.isSuccess && !sprints.length ? (
            <PageEmptyState
              icon={IconRunSprint}
              title="No sprints yet"
              description="Create a sprint for the current cycle. Give it a goal so the team knows what success looks like when it ends."
              action={
                <button className={pagePrimaryAction} onClick={() => setEditing("new")}>
                  New sprint
                </button>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {sprints.map((sprint) => (
                <SprintCard
                  key={sprint.id}
                  sprint={sprint}
                  tasks={state.tasks}
                  statuses={state.statuses}
                  pending={mutation.isPending}
                  onStart={() =>
                    mutation.mutate(() =>
                      client.request(`${path}/${sprint.id}`, {
                        method: "PATCH",
                        body: JSON.stringify({
                          status: sprint.status === "planned" ? "active" : "completed",
                        }),
                      }),
                    )
                  }
                  onEdit={() => setEditing(sprint)}
                  onTasks={() => setTasksFor(sprint)}
                  onDelete={() =>
                    mutation.mutate(() =>
                      client.request(`${path}/${sprint.id}`, { method: "DELETE" }),
                    )
                  }
                />
              ))}
            </div>
          )}

          {active && (
            <p className="mt-5 text-xs text-muted-foreground">
              Only one sprint should be active at a time — complete{" "}
              <span className="font-medium text-foreground">{active.name}</span> before starting the
              next.
            </p>
          )}
        </div>
      </div>

      {editing && (
        <SprintForm
          org={organizationId}
          project={projectId}
          path={path}
          sprint={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
      {tasksFor && (
        <SprintTasks
          org={organizationId}
          project={projectId}
          sprint={tasksFor}
          onClose={() => setTasksFor(null)}
        />
      )}
    </div>
  );
}

const statusStyles: Record<string, string> = {
  active: "bg-primary/10 text-primary",
  planned: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  cancelled: "bg-muted text-muted-foreground",
};

function SprintCard({
  sprint,
  tasks,
  statuses,
  pending,
  onStart,
  onEdit,
  onTasks,
  onDelete,
}: {
  sprint: Sprint;
  tasks: ProjectTask[];
  statuses: Array<{ id: string; group: string }>;
  pending: boolean;
  onStart: () => void;
  onEdit: () => void;
  onTasks: () => void;
  onDelete: () => void;
}) {
  const { total, done, percent } = useMemo(
    () => sprintProgress(tasks, statuses, sprint.id),
    [tasks, statuses, sprint.id],
  );
  const timing = sprintTiming(sprint.startDate, sprint.endDate);

  return (
    <article
      className={cn(
        "flex flex-col rounded-[14px] border bg-card p-4",
        sprint.status === "active"
          ? "border-primary/45 shadow-[0_8px_20px_-18px_rgba(15,23,42,0.35)]"
          : "border-border/70",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            statusStyles[sprint.status] ?? "bg-muted text-muted-foreground",
          )}
        >
          {sprint.status}
        </span>
        <ConfirmDialog
          title="Delete sprint?"
          description="Tasks stay in the project and become unassigned. This cannot be undone."
          destructive
          trigger={
            <button
              type="button"
              aria-label={`Delete ${sprint.name}`}
              className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <IconTrash className="size-4" />
            </button>
          }
          onConfirm={onDelete}
        />
      </div>

      <h2 className="mt-2.5 text-sm font-semibold tracking-[-0.01em]">{sprint.name}</h2>

      {/* The goal is the point of the card, so it gets real estate, not a tooltip. */}
      {sprint.goal ? (
        <p className="mt-1.5 line-clamp-3 text-xs leading-5 text-muted-foreground">{sprint.goal}</p>
      ) : (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs italic text-muted-foreground/80">
          <IconTarget className="size-3.5 shrink-0" />
          No goal set
        </p>
      )}

      <div className="mt-3.5">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>
            {done} of {total} {total === 1 ? "task" : "tasks"}
          </span>
          <span>{percent}%</span>
        </div>
        <div
          className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${sprint.name} progress`}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <p
        className={cn(
          "mt-3 flex items-center gap-1.5 text-[11px]",
          timing.overdue ? "font-medium text-destructive" : "text-muted-foreground",
        )}
      >
        <IconCalendar className="size-3.5 shrink-0" />
        {timing.label}
      </p>

      <div className="mt-3.5 flex flex-wrap gap-2 border-t border-border/60 pt-3">
        {sprint.status !== "completed" && sprint.status !== "cancelled" && (
          <button className={pageSecondaryAction} disabled={pending} onClick={onStart}>
            {sprint.status === "planned" ? "Start" : "Complete"}
          </button>
        )}
        <button className={pageSecondaryAction} onClick={onTasks}>
          Tasks
        </button>
        <button className={pageSecondaryAction} onClick={onEdit}>
          Edit
        </button>
      </div>
    </article>
  );
}

export function sprintProgress(
  tasks: ProjectTask[],
  statuses: Array<{ id: string; group: string }>,
  sprintId: string,
) {
  const assigned = tasks.filter((task) => task.sprintId === sprintId);
  const done = assigned.filter(
    (task) => statuses.find((status) => status.id === task.statusId)?.group === "done",
  ).length;
  return {
    total: assigned.length,
    done,
    percent: assigned.length ? Math.round((done / assigned.length) * 100) : 0,
  };
}

export function sprintTiming(startDate: string | null, endDate: string | null, now = new Date()) {
  if (!startDate || !endDate) return { label: "No dates set", overdue: false };
  const end = new Date(endDate);
  const endDay = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const daysLeft = Math.round((endDay - today) / 86_400_000);
  const range = `${formatDay(startDate)} – ${formatDay(endDate)}`;

  if (daysLeft < 0) return { label: `${range} · ended ${Math.abs(daysLeft)}d ago`, overdue: true };
  if (daysLeft === 0) return { label: `${range} · ends today`, overdue: false };
  return { label: `${range} · ${daysLeft}d left`, overdue: false };
}

function formatDay(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function SprintForm({
  org,
  project,
  path,
  sprint,
  onClose,
}: {
  org: string;
  project: string;
  path: string;
  sprint: Sprint | null;
  onClose: () => void;
}) {
  const [start, setStart] = useState(sprint?.startDate?.slice(0, 10) ?? "");
  const mutation = useWorkflowMutation([["sprints", org, project]], onClose);
  return (
    <WorkflowSheet title={sprint ? "Edit sprint" : "New sprint"} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const goal = String(data.get("goal") ?? "").trim();
          mutation.mutate(() =>
            client.request(sprint ? `${path}/${sprint.id}` : path, {
              method: sprint ? "PATCH" : "POST",
              body: JSON.stringify({
                name: String(data.get("name")).trim(),

                goal: goal || null,
                ...(start ? { startDate: start } : {}),
                ...(data.get("end") ? { endDate: data.get("end") } : {}),
              }),
            }),
          );
        }}
      >
        <WorkflowField
          label="Sprint name"
          name="name"
          required
          maxLength={255}
          defaultValue={sprint?.name}
          placeholder="Sprint 12 — onboarding"
        />
        <div className="space-y-1.5">
          <label htmlFor="sprint-goal" className="text-xs font-medium">
            Sprint goal
          </label>
          <textarea
            id="sprint-goal"
            name="goal"
            rows={3}
            maxLength={1000}
            defaultValue={sprint?.goal ?? ""}
            placeholder="What should be true when this sprint ends? e.g. A new user reaches their first board unaided."
            className={cn(pageInput, "h-auto resize-y py-2 leading-6")}
          />
          <p className="text-[11px] text-muted-foreground">
            Optional, but a sprint without one can only be judged on dates.
          </p>
        </div>
        <WorkflowField
          label="Start date"
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />
        <WorkflowField
          label="End date"
          type="date"
          name="end"
          min={start}
          defaultValue={sprint?.endDate?.slice(0, 10) ?? ""}
        />
        <WorkflowError error={mutation.error} />
        <WorkflowSubmit pending={mutation.isPending} />
      </form>
    </WorkflowSheet>
  );
}

function SprintTasks({
  org,
  project,
  sprint,
  onClose,
}: {
  org: string;
  project: string;
  sprint: Sprint;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const tasks = useQuery({
    queryKey: queryKeys.tasks(org, project),
    queryFn: () => projectsApi.getTasks(org, project),
  });
  const statuses = useQuery({
    queryKey: queryKeys.statuses(org, project),
    queryFn: () => statusesApi.getStatuses(org, project),
  });
  const mutation = useWorkflowMutation([queryKeys.tasks(org, project)]);
  const assigned = tasks.data?.filter((t) => t.sprintId === sprint.id) ?? [];
  const done = assigned.filter(
    (t) => statuses.data?.find((s) => s.id === t.statusId)?.group === "done",
  ).length;
  return (
    <WorkflowSheet title={sprint.name} onClose={onClose}>
      <div className="space-y-5">
        <p className="text-sm text-muted-foreground">
          {done} of {assigned.length} tasks completed
        </p>
        <progress
          className="h-2 w-full accent-primary"
          value={done}
          max={assigned.length || 1}
          aria-label="Sprint progress"
        />
        <WorkflowField
          label="Find tasks"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <WorkflowError error={tasks.error || statuses.error || mutation.error} />
        {tasks.isPending && <p role="status">Loading tasks…</p>}
        {tasks.data
          ?.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
          .map((t) => (
            <label key={t.id} className="flex items-center gap-3 rounded-xl border p-3 text-sm">
              <input
                type="checkbox"
                checked={t.sprintId === sprint.id}
                disabled={mutation.isPending}
                onChange={(e) =>
                  mutation.mutate(() =>
                    projectsApi.updateTask(org, project, t.id, {
                      sprintId: e.target.checked ? sprint.id : null,
                    }),
                  )
                }
              />
              <span>
                {t.name}
                <span className="block text-xs text-muted-foreground">
                  {statuses.data?.find((s) => s.id === t.statusId)?.name}
                  {t.sprintId && t.sprintId !== sprint.id
                    ? " · Assigned to another sprint (checking moves it here)"
                    : ""}
                </span>
              </span>
            </label>
          ))}
        {tasks.isSuccess && !tasks.data.length && (
          <p className="text-sm text-muted-foreground">
            Create tasks in this project to add them to the sprint.
          </p>
        )}
      </div>
    </WorkflowSheet>
  );
}
