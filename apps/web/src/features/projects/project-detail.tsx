import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  IconArrowLeft,
  IconCalendar,
  IconCheck,
  IconFlag,
  IconLayoutKanban,
  IconList,
  IconPlus,
  IconSearch,
} from "@tabler/icons-react";
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
    return state.tasks.filter((task) =>
      [task.name, task.description ?? "", task.priority, `#${task.sequenceId}`]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [search, state.tasks]);

  const completedTasks = state.tasks.filter((task) => {
    const status = state.statuses.find((item) => item.id === task.statusId);
    return status?.group === "done";
  }).length;

  const nextDue = state.tasks
    .map((task) => task.targetDate)
    .filter((date): date is string => Boolean(date))
    .map((date) => new Date(date).getTime())
    .filter((time) => !Number.isNaN(time))
    .sort((a, b) => a - b)[0];

  const setTaskStatus = (statusId: string) => state.setStatusId(statusId);

  return (
    <main className="min-h-full bg-background px-3 py-4 sm:px-5 lg:px-7">
      <div className="mx-auto max-w-[1440px] space-y-3">
        <div className="flex items-center gap-2">
          <Link
            to="/$organizationSlug/projects"
            params={{ organizationSlug }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
          >
            <IconArrowLeft className="size-3.5" />
            Projects
          </Link>
          <span className="text-xs text-muted-foreground">/</span>
          <span className="truncate text-xs font-medium text-foreground">{project.name}</span>
        </div>

        <section className="rounded-xl border bg-card shadow-sm">
          <div className="flex flex-col gap-4 border-b px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
                  {project.emoji ?? "P"}
                </span>
                {project.identifier}
              </div>
              <h1 className="mt-2 truncate text-xl font-semibold tracking-tight sm:text-2xl">{project.name}</h1>
              {project.description && (
                <p className="mt-1 max-w-3xl truncate text-sm text-muted-foreground">{project.description}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center">
              <Kpi label="Tasks" value={state.tasks.length} />
              <Kpi label="Done" value={completedTasks} />
              <Kpi label="Milestones" value={state.milestones.length} />
              <Kpi
                label="Next target"
                value={nextDue ? new Date(nextDue).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—"}
                icon={<IconCalendar className="size-3" />}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <div className="flex items-center rounded-lg bg-muted p-0.5">
                <ViewButton active={view === "kanban"} onClick={() => setView("kanban")} icon={<IconLayoutKanban className="size-3.5" />}>
                  Board
                </ViewButton>
                <ViewButton active={view === "list"} onClick={() => setView("list")} icon={<IconList className="size-3.5" />}>
                  List
                </ViewButton>
              </div>

              <label className="relative w-full max-w-sm sm:w-64">
                <IconSearch className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search tasks..."
                  className="h-8 w-full rounded-lg border bg-background pl-8 pr-3 text-xs outline-none transition focus:border-primary"
                />
              </label>
            </div>

            <TaskForm
              {...state}
              setStatusId={setTaskStatus}
            />
          </div>
        </section>

        {state.error && <ErrorMessage message={state.error} />}

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

        <section className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Project work</p>
              <h2 className="mt-1 text-sm font-semibold">{filteredTasks.length} visible tasks</h2>
            </div>
            {view === "kanban" && <p className="hidden text-[10px] text-muted-foreground sm:block">Drag a task between columns to change status</p>}
          </div>

          <div className="p-3 sm:p-4">
            {view === "kanban" ? (
              <KanbanBoard
                statuses={state.statuses}
                tasks={filteredTasks}
                onMove={state.moveTask}
                onSelect={onSelectTask}
                onAddTask={setTaskStatus}
              />
            ) : (
              <TaskList
                tasks={filteredTasks}
                statuses={state.statuses}
                onMove={state.moveTask}
                onSelect={onSelectTask}
              />
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

function Kpi({ label, value, icon }: { label: string; value: string | number; icon?: ReactNode }) {
  return (
    <div className="min-w-[78px] rounded-lg border bg-background px-2.5 py-2">
      <div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-sm font-semibold tracking-tight">{value}</p>
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
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-semibold transition ${active ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
    >
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
    <form onSubmit={submit} className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row lg:max-w-xl">
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Add a task..."
        className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        required
      />
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
