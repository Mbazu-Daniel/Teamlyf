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
  const { rows, groups, columns, loading, error, statusesByProjectId, moveToStatus, reschedule, deleteTask, duplicateTask } = useMyTasks(organizationId, search);
  const selectedRow = selectedTaskId ? rows.find((row) => row.task.id === selectedTaskId) : undefined;
  const projectCount = new Set(rows.map((row) => row.projectId)).size;
  const searching = search.trim().length > 0;

  function statusesFor(task: ProjectTask): Status[] {
    const row = rows.find((item) => item.task.id === task.id);
    return row ? statusesByProjectId.get(row.projectId) ?? [] : [];
  }

  return (
    <div className="flex min-w-0 h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <header className="border-b px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-tight">My Tasks</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {loading ? "Loading your tasks…" : `${rows.length} task${rows.length === 1 ? "" : "s"} assigned to you across ${projectCount} project${projectCount === 1 ? "" : "s"}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-lg bg-secondary p-0.5" role="group" aria-label="Task view">
              <button type="button" onClick={() => onViewChange("board")} className={cn("h-8 rounded-md px-2.5 text-xs font-medium", view === "board" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")} aria-pressed={view === "board"}>
                <IconLayoutKanban className="mr-1.5 inline size-3.5" /> Board
              </button>
              <button type="button" onClick={() => onViewChange("list")} className={cn("h-8 rounded-md px-2.5 text-xs font-medium", view === "list" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")} aria-pressed={view === "list"}>
                <IconList className="mr-1.5 inline size-3.5" /> List
              </button>
            </div>
            <div className="relative w-44 sm:w-56">
              <IconSearch className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks…" aria-label="Search my tasks" className="h-8 w-full rounded-lg border-border bg-secondary pl-8 pr-3 text-xs shadow-none outline-none transition-all focus:bg-background" />
            </div>
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-hidden p-3 sm:p-4">
        {error ? (
          <MutedMessage message={error} />
        ) : loading ? (
          <MutedMessage message="Loading your tasks…" />
        ) : rows.length === 0 ? (
          searching ? (
            <MutedMessage className="rounded-xl border border-dashed p-10 text-center" message="No tasks match your search." />
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed">
              <div className="max-w-sm px-6 text-center">
                <IconCircleCheck className="mx-auto size-6 text-muted-foreground" aria-hidden="true" />
                <p className="mt-3 text-sm font-medium">Nothing is assigned to you</p>
                <p className="mt-1 text-sm text-muted-foreground">Tasks assigned to you show up here, from every project you can see.</p>
              </div>
            </div>
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
