import { useMemo, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { IconArrowLeft, IconCalendar, IconCheck, IconFlag, IconLayoutKanban, IconList, IconPlus, IconSearch } from "@tabler/icons-react";
import type { Project, ProjectTask, Status } from "@/lib/api";
import { ErrorMessage } from "./feedback";
import { KanbanBoard } from "./board";
import { MilestonesSection } from "./milestones";
import { TaskDetailPanel } from "./task-detail-panel";
import { TaskList } from "./task-list";

type ProjectPageState = Omit<ReturnType<typeof import("./hooks").useProjectPage>, "project">;

type ProjectDetailPageProps = {
  project: Project;
  state: ProjectPageState;
  organizationId: string;
  organizationSlug: string;
  selectedTaskId: string | null;
  onSelectTask: (task: ProjectTask) => void;
  onCloseTask: () => void;
};

export function ProjectDetailPage({
  project,
  state,
  organizationId,
  organizationSlug,
  selectedTaskId,
  onSelectTask,
  onCloseTask,
}: ProjectDetailPageProps) {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return state.tasks;
    return state.tasks.filter(
      (task) =>
        task.name.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.priority.toLowerCase().includes(query),
    );
  }, [search, state.tasks]);

  const completedTasks = state.tasks.filter((task) => {
    const status = state.statuses.find((item) => item.id === task.statusId);
    return status?.group === "done";
  }).length;

  const upcomingDates = state.tasks
    .map((task) => task.targetDate)
    .filter((date): date is string => Boolean(date))
    .map((date) => new Date(date).getTime())
    .filter((time) => !Number.isNaN(time))
    .sort((a, b) => a - b);

  const nextDue = upcomingDates[0];

  return (
    <main className="min-h-full bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <Link
          to="/$organizationSlug/projects"
          params={{ organizationSlug }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <IconArrowLeft className="size-3.5" />
          Projects
        </Link>

        <section className="rounded-2xl border bg-card p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">{project.emoji ?? "P"}</span>
                {project.identifier}
              </div>
              <h1 className="mt-3 truncate text-2xl font-semibold tracking-tight sm:text-3xl">{project.name}</h1>
              {project.description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{project.description}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border px-3 py-1.5 text-xs font-medium capitalize">{project.status.replace(/_/g, " ")}</span>
              <span className="rounded-full border px-3 py-1.5 text-xs font-medium">{state.milestones.length} milestones</span>
            </div>
          </div>

          <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Tasks" value={state.tasks.length} />
            <Kpi label="Completed" value={completedTasks} icon={<IconCheck className="size-3.5" />} />
            <Kpi label="Milestones" value={state.milestones.length} icon={<IconFlag className="size-3.5" />} />
            <Kpi label="Next target" value={nextDue ? new Date(nextDue).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "No date"} icon={<IconCalendar className="size-3.5" />} />
          </div>
        </section>

        <MilestonesSection
          milestones={state.milestones}
          loading={state.milestonesLoading}
          createMilestone={state.createMilestone}
          deleteMilestone={state.deleteMilestone}
        />

        <section className="rounded-2xl border bg-card">
          <div className="flex flex-col gap-3 border-b px-4 py-3 sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Work</p>
                <h2 className="mt-1 text-base font-semibold">Tasks</h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-lg bg-muted p-0.5">
                  <ViewButton active={view === "kanban"} onClick={() => setView("kanban")} icon={<IconLayoutKanban className="size-3.5" />}>Kanban</ViewButton>
                  <ViewButton active={view === "list"} onClick={() => setView("list")} icon={<IconList className="size-3.5" />}>List</ViewButton>
                </div>
                <label className="relative w-44 sm:w-56">
                  <IconSearch className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks..." className="h-8 w-full rounded-lg border bg-background pl-8 pr-3 text-xs outline-none focus:border-primary" />
                </label>
              </div>
            </div>
            <TaskForm {...state} />
          </div>

          {state.error && <div className="px-4 sm:px-5"><ErrorMessage message={state.error} /></div>}

          <div className="p-4 sm:p-5">
            {view === "kanban" ? (
              <KanbanBoard statuses={state.statuses} tasks={filteredTasks} onMove={state.moveTask} onSelect={onSelectTask} />
            ) : (
              <TaskList tasks={filteredTasks} statuses={state.statuses} onMove={state.moveTask} onSelect={onSelectTask} />
            )}
          </div>
        </section>
      </div>

      <TaskDetailPanel
        organizationId={organizationId}
        projectId={project.id}
        taskId={selectedTaskId}
        statuses={state.statuses}
        onClose={onCloseTask}
      />
    </main>
  );
}

function Kpi({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-background p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-semibold transition ${active ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
      {icon}
      {children}
    </button>
  );
}

function TaskForm({
  name,
  statusId,
  statuses,
  loading,
  setName,
  setStatusId,
  createTask,
}: Pick<ProjectPageState, "name" | "statusId" | "statuses" | "loading" | "setName" | "setStatusId" | "createTask">) {
  function submit(event: FormEvent) {
    createTask(event);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Add a task..." className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary" required />
      <select value={statusId} onChange={(event) => setStatusId(event.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm" required>
        {statuses.map((status: Status) => <option key={status.id} value={status.id}>{status.name}</option>)}
      </select>
      <button disabled={loading || !statusId} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">
        <IconPlus className="size-3.5" />
        {loading ? "Adding..." : "Add task"}
      </button>
    </form>
  );
}
