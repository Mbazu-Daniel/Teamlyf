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
  IconSettings,
  IconLink,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [section, setSection] = useState<"tasks" | "milestones">("tasks");

  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return state.tasks;
    return state.tasks.filter((task) =>
      task.name.toLowerCase().includes(query) ||
      String(task.sequenceId).includes(query),
    );
  }, [searchQuery, state.tasks]);

  return (
    <div className="flex min-w-0 h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-col border-b px-3 py-2">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <div className="flex items-center rounded-lg bg-secondary p-0.5">
              <button type="button" onClick={() => { setView("kanban"); setSection("tasks"); }} className={cn("h-8 rounded-md px-2.5 text-xs font-medium", view === "kanban" && section === "tasks" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                <IconLayoutKanban className="mr-1.5 inline size-3.5" /> Board
              </button>
              <button type="button" onClick={() => { setView("list"); setSection("tasks"); }} className={cn("h-8 rounded-md px-2.5 text-xs font-medium", view === "list" && section === "tasks" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                <IconList className="mr-1.5 inline size-3.5" /> List
              </button>
              <button type="button" onClick={() => setSection("milestones")} className={cn("h-8 rounded-md px-2.5 text-xs font-medium", section === "milestones" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                Milestones
              </button>
            </div>

            {section === "tasks" && (
              <div className="relative w-44 sm:w-56">
                <IconSearch className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search tasks…" className="h-8 w-full rounded-lg border-border bg-secondary pl-8 text-xs shadow-none outline-none transition-all focus:bg-background" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {project.members?.length ? (
              <div className="flex items-center -space-x-2">
                {project.members.slice(0, 5).map((member) => (
                  <div key={member.id} title={`${member.firstName ?? ""} ${member.lastName ?? ""}`.trim()} className="grid size-8 place-items-center rounded-full border-2 border-background bg-muted text-[10px] font-semibold">
                    {((member.firstName?.[0] ?? "") + (member.lastName?.[0] ?? "")).toUpperCase() || "M"}
                  </div>
                ))}
              </div>
            ) : null}

            <button type="button" className="grid size-8 place-items-center rounded-full border border-dashed hover:bg-accent" aria-label="Add project member">
              <IconPlus className="size-3.5" />
            </button>
            <Link to="/$organizationSlug/projects" params={{ organizationSlug }} className="grid size-8 place-items-center rounded-md border hover:bg-accent" aria-label="Project settings">
              <IconSettings className="size-3.5" />
            </Link>
            <button type="button" className="grid size-8 place-items-center rounded-md border hover:bg-accent" aria-label="Copy project link" onClick={() => navigator.clipboard.writeText(window.location.href)}>
              <IconLink className="size-3.5" />
            </button>
            <button type="button" className="h-8 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90" onClick={() => { state.setStatusId(state.statusId); }}>
              <IconPlus className="mr-1.5 inline size-3.5" /> Add task
            </button>
          </div>
        </div>
      </div>

      {section === "tasks" ? (
        view === "kanban" ? (
          <KanbanBoard statuses={state.statuses} tasks={filteredTasks} onMove={state.moveTask} onSelect={onSelectTask} onAddTask={state.setStatusId} onDelete={state.deleteTask} onDuplicate={state.duplicateTask} />
        ) : (
          <TaskList tasks={filteredTasks} statuses={state.statuses} onMove={state.moveTask} onSelect={onSelectTask} onDelete={state.deleteTask} onDuplicate={state.duplicateTask} onAddTask={state.setStatusId} />
        )
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <MilestonesSection milestones={state.milestones} tasks={state.tasks} loading={state.milestonesLoading} statuses={state.statuses} createMilestone={state.createMilestone} updateMilestone={state.updateMilestone} deleteMilestone={state.deleteMilestone} addTaskToMilestone={state.addTaskToMilestone} removeTaskFromMilestone={state.removeTaskFromMilestone} />
        </div>
      )}

      <TaskDetailPanel organizationId={organizationId} projectId={project.id} taskId={selectedTaskId} statuses={state.statuses} onClose={onCloseTask} />
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return <div className="hidden min-w-[72px] rounded-lg border bg-background px-2.5 py-1.5 sm:block"><p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</p><p className="mt-0.5 text-xs font-semibold">{value}</p></div>;
}
