import { useState } from "react";
import type { ProjectTask, Status } from "@/lib/api";
import { IconChevronDown, IconChevronUp, IconPlus } from "@tabler/icons-react";
import { MutedMessage } from "./feedback";
import { TaskCard } from "./task-card";

export function StatusColumn({
  status,
  tasks,
  statuses,
  onMove,
  onSelect,
  onAddTask,
  onDelete,
  onDuplicate,
}: {
  status: Status;
  tasks: ProjectTask[];
  statuses: Status[];
  onMove: (task: ProjectTask, statusId: string) => void;
  onSelect: (task: ProjectTask) => void;
  onAddTask?: (statusId: string) => void;
  onDelete?: (task: ProjectTask) => void;
  onDuplicate?: (task: ProjectTask) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const statusTasks = tasks.filter((task) => task.statusId === status.id);

  if (collapsed) {
    return (
      <section className="flex min-h-[420px] w-14 shrink-0 flex-col rounded-2xl border bg-muted/20">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="flex h-full flex-col items-center gap-3 rounded-2xl px-2 py-3 hover:bg-muted/40"
          title={`${status.name} · ${statusTasks.length} tasks`}
        >
          <span className="size-2 rounded-full" style={{ backgroundColor: status.color }} />
          <span className="min-h-0 flex-1 text-[11px] font-semibold text-muted-foreground [writing-mode:vertical-rl]">
            {status.name}
          </span>
          <span className="rounded-full bg-background px-2 py-1 text-[10px] font-semibold">
            {statusTasks.length}
          </span>
          <IconChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      </section>
    );
  }

  return (
    <section
      className="flex min-h-[420px] w-[285px] shrink-0 flex-col rounded-2xl border bg-muted/20 p-2"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const taskId = event.dataTransfer.getData("text/plain");
        const task = tasks.find((item) => item.id === taskId);
        if (task) onMove(task, status.id);
      }}
    >
      <div className="flex items-center gap-2 px-2 py-2">
        <span className="size-2 rounded-full" style={{ backgroundColor: status.color }} aria-hidden="true" />
        <h2 className="min-w-0 flex-1 truncate text-xs font-semibold">{status.name}</h2>
        <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
          {statusTasks.length}
        </span>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground"
          aria-label={`Collapse ${status.name}`}
        >
          <IconChevronUp className="size-3.5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-1 pb-1">
        {statusTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            statuses={statuses}
            onMove={onMove}
            onSelect={onSelect}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
          />
        ))}
        {statusTasks.length === 0 && (
          <MutedMessage
            className="rounded-xl border border-dashed p-5 text-center text-xs"
            message="Drop tasks here"
          />
        )}
      </div>

      {onAddTask && (
        <button
          type="button"
          onClick={() => onAddTask(status.id)}
          className="mt-1 flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-background hover:text-foreground"
        >
          <IconPlus className="size-3.5" />
          New work item
        </button>
      )}
    </section>
  );
}

export function KanbanBoard({
  statuses,
  tasks,
  onMove,
  onSelect,
  onAddTask,
  onDelete,
  onDuplicate,
}: {
  statuses: Status[];
  tasks: ProjectTask[];
  onMove: (task: ProjectTask, statusId: string) => void;
  onSelect: (task: ProjectTask) => void;
  onAddTask?: (statusId: string) => void;
  onDelete?: (task: ProjectTask) => void;
  onDuplicate?: (task: ProjectTask) => void;
}) {
  return (
    <div className="flex min-h-[420px] gap-3 overflow-x-auto pb-2">
      {statuses.map((status) => (
        <StatusColumn
          key={status.id}
          status={status}
          tasks={tasks}
          statuses={statuses}
          onMove={onMove}
          onSelect={onSelect}
          onAddTask={onAddTask}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
        />
      ))}
      {statuses.length === 0 && (
        <MutedMessage className="w-full rounded-2xl border border-dashed p-10 text-center" message="No workflow statuses configured." />
      )}
    </div>
  );
}
