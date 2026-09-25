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
  const [section, setSection] = useState<"tasks" | "milestones">("tasks");
  const [view, setView] = useState<"kanban" | "list">("list");
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

  return (
    <main className="min-h-full bg-background">
      <div className="mx-auto max-w-[1500px]">
        <header className="border-b bg-card px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <Link
                to="/$organizationSlug/projects"
                params={{ organizationSlug }}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
              >
                <IconArrowLeft className="size-3.5" /> Projects
              </Link>
              <div className="mt-3 flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg border bg-background text-sm font-semibold text-primary">
                  {project.emoji ?? project.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="truncate text-xl font-semibold tracking-tight">{project.name}</h1>
                    <span className="rounded-md bg-muted px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{project.identifier}</span>
                  </div>
                  {project.description && <p className="mt-1 max-w-3xl truncate text-xs text-muted-foreground">{project.description}</p>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Kpi label="Tasks" value={state.tasks.length} />
              <Kpi label="Done" value={completedTasks} />
              <Kpi label="Milestones" value={state.milestones.length} />
              <Kpi label="Next target" value={nextDue ? new Date(nextDue).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—"} />
            </div>
          </div>

          <nav className="mt-5 flex items-center gap-1 border-b" aria-label="Project sections">
            <SectionButton active={section === "tasks"} onClick={() => setSection("tasks")} icon={<IconCheck className="size-3.5" />}>
              Tasks
              <Count>{state.tasks.length}</Count>
            </SectionButton>
            <SectionButton active={section === "milestones"} onClick={() => setSection("milestones")} icon={<IconFlag className="size-3.5" />}>
              Milestones
              <Count>{state.milestones.length}</Count>
            </SectionButton>
          </nav>
        </header>

        {state.error && <div className="px-4 pt-4 sm:px-6"><ErrorMessage message={state.error} /></div>}

        {section === "tasks" ? (
          <section className="px-3 py-4 sm:px-5">
            <div className="rounded-xl border bg-card shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-lg bg-muted p-0.5">
                    <ViewButton active={view === "list"} onClick={() => setView("list")} icon={<IconList className="size-3.5" />}>List</ViewButton>
                    <ViewButton active={view === "kanban"} onClick={() => setView("kanban")} icon={<IconLayoutKanban className="size-3.5" />}>Board</ViewButton>
                  </div>
                  <label className="relative w-52">
                    <IconSearch className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks" className="h-8 w-full rounded-lg border bg-background pl-8 pr-3 text-xs outline-none focus:border-primary" />
                  </label>
                </div>
                <TaskForm {...state} />
              </div>

              <div className="p-3 sm:p-4">
                {view === "list" ? (
                  <TaskList tasks={filteredTasks} statuses={state.statuses} onMove={state.moveTask} onSelect={onSelectTask} onDelete={state.deleteTask} onDuplicate={state.duplicateTask} onAddTask={state.setStatusId} />
                ) : (
                  <KanbanBoard statuses={state.statuses} tasks={filteredTasks} onMove={state.moveTask} onSelect={onSelectTask} onAddTask={state.setStatusId} />
                )}
              </div>
            </div>
          </section>
        ) : (
          <section className="px-3 py-4 sm:px-5">
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
          </section>
        )}
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

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="hidden min-w-[72px] rounded-lg border bg-background px-2.5 py-1.5 sm:block">
      <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xs font-semibold">{value}</p>
    </div>
  );
}

function Count({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold">{children}</span>;
}

function SectionButton({
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
    <button type="button" onClick={onClick} className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition ${active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
      {icon}
      {children}
    </button>
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
    <button type="button" onClick={onClick} className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-semibold transition ${active ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
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
    <form onSubmit={submit} className="flex min-w-[280px] flex-1 gap-2 sm:max-w-md">
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Add a task..." className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary" required />
      <select value={statusId} onChange={(event) => setStatusId(event.target.value)} className="max-w-32 rounded-lg border bg-background px-3 py-2 text-sm" required>
        {statuses.map((status: Status) => <option key={status.id} value={status.id}>{status.name}</option>)}
      </select>
      <button disabled={loading || !statusId} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">
        <IconPlus className="size-3.5" /> {loading ? "Adding..." : "Add"}
      </button>
    </form>
  );
}
