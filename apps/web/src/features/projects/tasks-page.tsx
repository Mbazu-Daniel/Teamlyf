import { useState } from "react";
import { IconCircleCheck, IconLayoutKanban, IconList, IconSearch } from "@tabler/icons-react";
import type { ProjectTask, Status } from "@/lib/api";
import { cn } from "@/lib/utils";
import { GroupedBoard } from "./board";
import { MutedMessage } from "./feedback";
import { TaskDetailPanel } from "./task-detail-panel";
import { TaskList } from "./task-list";
import type { TaskView } from "./task-search";
import { useMyTasks } from "./use-my-tasks";
import { PageEmptyState, pageInput, pagePrimaryAction } from "@/components/workspace/page-layout";
import { CreateTask } from "./create-task";
import { useQuery } from "@tanstack/react-query";
import { projectsApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

type TasksPageProps = Readonly<{
  organizationId: string | undefined;
  /** The active board/list view — URL state, so the arrangement is a link. */
  view: TaskView;
  onViewChange: (view: TaskView) => void;
  selectedTaskId: string | null;
  onSelectTask: (task: ProjectTask) => void;
  onCloseTask: () => void;
}>;

/** Everything assigned to the signed-in member, across every project they can see. */
export function TasksPage({ organizationId, view, onViewChange, selectedTaskId, onSelectTask, onCloseTask }: TasksPageProps) {
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<"mine" | "all">("mine");
  const [projectFilter, setProjectFilter] = useState("all");
  const [priority, setPriority] = useState("all");
  const [creating, setCreating] = useState(false);
  const projects = useQuery({ queryKey: queryKeys.projects(organizationId ?? ""), queryFn: () => projectsApi.getProjects(organizationId!), enabled: !!organizationId });
  const { rows, groups, columns, loading, error, statusesByProjectId, moveToStatus, reschedule, deleteTask, duplicateTask } = useMyTasks(organizationId, search, { scope, projectFilter, priority });
  const selectedRow = selectedTaskId ? rows.find((row) => row.task.id === selectedTaskId) : undefined;
  const projectCount = new Set(rows.map((row) => row.projectId)).size;
  const searching = search.trim().length > 0 || projectFilter !== "all" || priority !== "all" || scope === "all";

  function statusesFor(task: ProjectTask): Status[] {
    const row = rows.find((item) => item.task.id === task.id);
    return row ? statusesByProjectId.get(row.projectId) ?? [] : [];
  }

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-[1440px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <header className="rounded-[16px] border border-border/70 bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Personal workspace</p>
            <h1 className="mt-1 truncate text-2xl font-semibold tracking-[-0.03em]">{scope === "mine" ? "My Tasks" : "Workspace Tasks"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {loading ? "Loading tasks…" : `${rows.length} tasks ${scope === "mine" ? "assigned to you " : ""}across ${projectCount} projects`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-control items-center rounded-[10px] bg-muted/75 p-1" role="group" aria-label="Task view">
              <button type="button" onClick={() => onViewChange("board")} className={cn("h-control-inner rounded-[8px] px-3 text-xs font-semibold transition-colors", view === "board" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")} aria-pressed={view === "board"}>
                <IconLayoutKanban className="mr-1.5 inline size-3.5" /> Board
              </button>
              <button type="button" onClick={() => onViewChange("list")} className={cn("h-control-inner rounded-[8px] px-3 text-xs font-semibold transition-colors", view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")} aria-pressed={view === "list"}>
                <IconList className="mr-1.5 inline size-3.5" /> List
              </button>
            </div>
            <div className="relative min-w-[160px] flex-1 sm:w-64">
              <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks…" aria-label="Search my tasks" className="h-control w-full rounded-[10px] border border-border/80 bg-muted/45 pl-9 pr-3 text-sm font-normal shadow-none outline-none transition focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/10" />
            </div>
          </div>
        </div>
      </header>
      <div className="flex flex-wrap gap-3">
        <select aria-label="Task scope" className={`${pageInput} !w-auto`} value={scope} onChange={(e) => setScope(e.target.value as "mine" | "all")}><option value="mine">My tasks</option><option value="all">All workspace tasks</option></select>
        <select aria-label="Filter by project" className={`${pageInput} !w-auto`} value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}><option value="all">All projects</option>{projects.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <select aria-label="Filter by priority" className={`${pageInput} !w-auto`} value={priority} onChange={(e) => setPriority(e.target.value)}>{["all", "none", "low", "medium", "high", "urgent"].map((p) => <option key={p}>{p}</option>)}</select>
        <button className={pagePrimaryAction} disabled={!organizationId} onClick={() => setCreating(true)}>Create task</button>
      </div>
      {creating && organizationId && <CreateTask org={organizationId} onClose={() => setCreating(false)} />}

      <main className={`scrollbar-hidden min-h-0 overflow-auto rounded-[16px] border border-border/70 bg-card p-4 sm:p-5 ${view === "board" && rows.length > 0 ? "shrink-0" : "flex-1"}`}>
        {error ? (
          <MutedMessage message={error} />
        ) : loading ? (
          <MutedMessage message="Loading your tasks…" />
        ) : rows.length === 0 ? (
          searching ? (
            <MutedMessage className="rounded-xl border border-dashed p-10 text-center" message="No tasks match your search." />
          ) : (
            <PageEmptyState icon={IconCircleCheck} title="Nothing is assigned to you" description="Tasks assigned to you show up here, from every project you can see." className="h-full" />
          )
        ) : view === "board" ? (
          <GroupedBoard columns={columns} allTasks={rows.map((row) => row.task)} statusesFor={statusesFor} onMove={moveToStatus} onDropColumn={reschedule} onSelect={onSelectTask} onDelete={deleteTask} onDuplicate={duplicateTask} />
        ) : (
          <TaskList groups={groups} onSelect={onSelectTask} onDelete={deleteTask} onDuplicate={duplicateTask} />
        )}
      </main>

      {selectedRow && (
        <TaskDetailPanel
          organizationId={organizationId ?? ""}
          projectId={selectedRow.projectId}
          taskId={selectedRow.task.id}
          statuses={statusesByProjectId.get(selectedRow.projectId) ?? []}
          onClose={onCloseTask}
        />
      )}
    </div>
  );
}
