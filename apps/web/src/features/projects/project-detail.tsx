import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { IconLayoutKanban, IconList, IconPlus, IconSearch, IconSettings, IconLink } from "@tabler/icons-react";
import type { Project, ProjectTask } from "@/lib/api";
import { KanbanBoard } from "./board";
import { MilestonesSection } from "./milestones";
import { TaskDetailPanel } from "./task-detail-panel";
import { TaskList } from "./task-list";
import type { TaskView } from "./task-search";
import { cn } from "@/lib/utils";
import { Sprints } from "./sprints";
import { CreateTask } from "./create-task";
import { pageInput } from "@/components/workspace/page-layout";


type ProjectPageState = Omit<ReturnType<typeof import("./hooks").useProjectPage>, "project">;

type ProjectDetailPageProps = {
  project: Project;
  state: ProjectPageState;
  organizationId: string;
  organizationSlug: string;
  selectedTaskId: string | null;
  /** The active board/list view. URL state, so the view is shareable. */
  view: TaskView;
  onViewChange: (view: TaskView) => void;
  onSelectTask: (task: ProjectTask) => void;
  onCloseTask: () => void;
};

// fallow-ignore-next-line complexity -- project detail coordinates board/list/milestone views and their shared task state
export function ProjectDetailPage({ project, state, organizationId, organizationSlug, selectedTaskId, view, onViewChange, onSelectTask, onCloseTask }: ProjectDetailPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [priority, setPriority] = useState("all");
  const [section, setSection] = useState<"tasks" | "milestones" | "sprints">("tasks");
  const [showAddTask, setShowAddTask] = useState(false);
  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return state.tasks.filter((task) => (priority === "all" || task.priority === priority) && (!query || task.name.toLowerCase().includes(query) || String(task.sequenceId).includes(query)));
  }, [searchQuery, priority, state.tasks]);

  return (
    <div className="mx-auto h-full min-h-0 w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
    <div className="flex min-w-0 h-full w-full flex-col overflow-hidden rounded-[16px] border border-border/70 bg-card shadow-none">
      <header className="border-b border-border/70 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-primary/12 text-sm font-semibold text-primary">
              {project.emoji || project.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-base font-semibold tracking-[-0.015em]">{project.name}</h1>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{project.identifier}</span>
              </div>
              {project.description && <p className="mt-1 truncate text-sm text-muted-foreground">{project.description}</p>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-control items-center rounded-[10px] bg-muted/75 p-1">
              <button type="button" onClick={() => { onViewChange("board"); setSection("tasks"); }} className={cn("h-control-inner rounded-[8px] px-3 text-xs font-semibold transition-colors", view === "board" && section === "tasks" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}><IconLayoutKanban className="mr-1.5 inline size-3.5" /> Board</button>
              <button type="button" onClick={() => { onViewChange("list"); setSection("tasks"); }} className={cn("h-control-inner rounded-[8px] px-3 text-xs font-semibold transition-colors", view === "list" && section === "tasks" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}><IconList className="mr-1.5 inline size-3.5" /> List</button>
              <button type="button" onClick={() => setSection("milestones")} className={cn("h-control-inner rounded-[8px] px-3 text-xs font-semibold transition-colors", section === "milestones" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>Milestones</button>
              <button type="button" className="h-control-inner rounded-lg px-3 text-xs font-semibold" onClick={() => setSection("sprints")}>Sprints</button>
            </div>
            {section === "tasks" && <select aria-label="Priority filter" className={`${pageInput} !w-auto`} value={priority} onChange={(e) => setPriority(e.target.value)}>{["all", "none", "low", "medium", "high", "urgent"].map((p) => <option key={p}>{p}</option>)}</select>}
            {section === "tasks" && <div className="relative w-48 sm:w-60"><IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search tasks…" className="h-control w-full rounded-[10px] border border-border/80 bg-muted/45 pl-9 text-sm font-normal shadow-none outline-none transition focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/10" /></div>}
          </div>
          <div className="flex items-center gap-2">
            {project.members?.length ? <div className="flex items-center -space-x-2">{project.members.slice(0, 5).map((member) => <div key={member.id} title={`${member.firstName ?? ""} ${member.lastName ?? ""}`.trim()} className="grid size-8 place-items-center rounded-full border-2 border-background bg-muted text-[10px] font-semibold">{((member.firstName?.[0] ?? "") + (member.lastName?.[0] ?? "")).toUpperCase() || "M"}</div>)}</div> : null}

<Link to="/$organizationSlug/projects/$projectId/settings" params={{ organizationSlug, projectId: project.identifier }} className="grid size-9 place-items-center rounded-[9px] border border-border/80 transition hover:bg-muted" aria-label="Project settings"><IconSettings className="size-4" /></Link>
            <button type="button" className="grid size-9 place-items-center rounded-[9px] border border-border/80 transition hover:bg-muted" aria-label="Copy project link" onClick={() => navigator.clipboard.writeText(window.location.href)}><IconLink className="size-4" /></button>
            <button type="button" className="h-control rounded-[10px] bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90" onClick={() => { setSection("tasks"); setShowAddTask((value) => !value); }}><IconPlus className="mr-1.5 inline size-4" /> Add task</button>
          </div>
        </div>
      </header>
      {showAddTask && <CreateTask org={organizationId} project={project.id} status={state.statusId} onClose={() => setShowAddTask(false)} />}
      <main className="min-h-0 flex-1 overflow-hidden">
        {section === "tasks" ? (
          <div className="h-full min-h-0 overflow-hidden p-4 md:p-5">
            {view === "board" ? (
              <KanbanBoard statuses={state.statuses} tasks={filteredTasks} onMove={state.moveTask} onSelect={onSelectTask} onAddTask={(statusId) => { state.setStatusId(statusId); setShowAddTask(true); }} onDelete={(task) => state.deleteTask(task.id)} onDuplicate={state.duplicateTask} />
            ) : (
              <TaskList groups={[{ id: "all", rows: filteredTasks.map((task) => ({ task, status: state.statuses.find((status) => status.id === task.statusId) })) }]} onSelect={onSelectTask} onDelete={(task) => state.deleteTask(task.id)} onDuplicate={state.duplicateTask} />
            )}
          </div>
        ) : (
          <div className="h-full min-h-0 overflow-y-auto p-5">
            {section === "sprints" ? <Sprints org={organizationId} project={project.id} /> : <MilestonesSection milestones={state.milestones} tasks={state.tasks} loading={state.milestonesLoading} statuses={state.statuses} createMilestone={state.createMilestone} updateMilestone={state.updateMilestone} deleteMilestone={state.deleteMilestone} addTaskToMilestone={state.addTaskToMilestone} removeTaskFromMilestone={state.removeTaskFromMilestone} />}
          </div>
        )}
      </main>
      <TaskDetailPanel organizationId={organizationId} projectId={project.id} taskId={selectedTaskId} statuses={state.statuses} onClose={onCloseTask} />
    </div>
    </div>
  );
}
