import { type DragEvent, useState } from "react";
import type { ProjectTask, Status } from "@/lib/api";
import { IconChevronDown, IconChevronUp, IconPlus } from "@tabler/icons-react";
import { MutedMessage } from "./feedback";
import { TaskCard } from "./task-card";

const boardLayout = "scrollbar-hidden flex h-[380px] gap-3 overflow-x-auto overflow-y-hidden";

/**
 * A board column is a name, a colour and its cards — statuses on a project board
 * and date buckets on My Tasks both fit it. `droppable: false` makes a column a
 * read-out that never accepts a drag.
 */
export type BoardColumnData = Readonly<{ id: string; name: string; color: string; tasks: readonly ProjectTask[]; droppable?: boolean }>;

function BoardColumn({ column, allTasks, statusesFor, onMove, onDrop, onSelect, onAddTask, onDelete, onDuplicate }: {
  column: BoardColumnData;
  /** Every card on the board: a drop can arrive from any other column. */
  allTasks: readonly ProjectTask[];
  statusesFor: (task: ProjectTask) => Status[];
  /** Present on a single-project board, so a card can switch status inline. */
  onMove?: (task: ProjectTask, statusId: string) => void;
  /** Omitted, or paired with `column.droppable: false`, leaves the column read-only. */
  onDrop?: (task: ProjectTask) => void;
  onSelect: (task: ProjectTask) => void;
  onAddTask?: () => void;
  onDelete?: (task: ProjectTask) => void;
  onDuplicate?: (task: ProjectTask) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const dropHandler = column.droppable === false || !onDrop ? undefined : (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    const task = allTasks.find((item) => item.id === event.dataTransfer.getData("text/plain"));
    if (task) onDrop(task);
  };

  if (collapsed) {
    return (
      <section className="flex h-full min-h-0 w-14 shrink-0 flex-col rounded-2xl border bg-muted/20">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="flex h-full flex-col items-center gap-3 rounded-2xl px-2 py-3 hover:bg-muted/40"
          title={`${column.name} · ${column.tasks.length} tasks`}
        >
          <span className="size-2 rounded-full" style={{ backgroundColor: column.color }} />
          <span className="min-h-0 flex-1 text-[11px] font-semibold text-muted-foreground [writing-mode:vertical-rl]">
            {column.name}
          </span>
          <span className="rounded-full bg-background px-2 py-1 text-[10px] font-semibold">
            {column.tasks.length}
          </span>
          <IconChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      </section>
    );
  }

  return (
    <section
      className="flex h-full min-h-0 w-[300px] shrink-0 flex-col rounded-[16px] border border-border/40 bg-muted/35 p-2.5"
      onDragOver={dropHandler ? (event) => event.preventDefault() : undefined}
      onDrop={dropHandler}
    >
      <div className="mb-2 flex items-center gap-2 rounded-[10px] px-2 py-2.5">
        <span className="size-2 rounded-full" style={{ backgroundColor: column.color }} aria-hidden="true" />
        <h2 className="min-w-0 flex-1 truncate text-xs font-semibold">{column.name}</h2>
        <span className="rounded-md border border-border/50 bg-card px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {column.tasks.length}
        </span>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground"
          aria-label={`Collapse ${column.name}`}
        >
          <IconChevronUp className="size-3.5" />
        </button>
      </div>

      <div className="scrollbar-hidden min-h-0 flex-1 space-y-3 overflow-y-auto px-0.5 pb-1">
        {column.tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            statuses={statusesFor(task)}
            onMove={onMove}
            onSelect={onSelect}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
          />
        ))}
        {column.tasks.length === 0 && (
          <MutedMessage
            className="rounded-xl border border-dashed p-5 text-center text-xs"
            message={dropHandler ? "Drop tasks here" : "No tasks"}
          />
        )}
      </div>

      {onAddTask && (
        <button
          type="button"
          onClick={onAddTask}
          className="mt-1 flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-background hover:text-foreground"
        >
          <IconPlus className="size-3.5" />
          New work item
        </button>
      )}
    </section>
  );
}

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
  return (
    <BoardColumn
      column={{ id: status.id, name: status.name, color: status.color, tasks: tasks.filter((task) => task.statusId === status.id) }}
      allTasks={tasks}
      statusesFor={() => statuses}
      onMove={onMove}
      onDrop={(task) => onMove(task, status.id)}
      onSelect={onSelect}
      onAddTask={onAddTask ? () => onAddTask(status.id) : undefined}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
    />
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
    <div className={boardLayout}>
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

/**
 * Cross-project board: the caller supplies the grouping, so My Tasks passes its
 * four date buckets. Cards carry their own project id, so a drop is resolved
 * against the task's own project rather than against the column.
 */
export function GroupedBoard({ columns, allTasks, statusesFor, onMove, onDropColumn, onSelect, onDelete, onDuplicate }: {
  columns: readonly BoardColumnData[];
  allTasks: readonly ProjectTask[];
  statusesFor: (task: ProjectTask) => Status[];
  onMove?: (task: ProjectTask, statusId: string) => void;
  onDropColumn: (task: ProjectTask, columnId: string) => void;
  onSelect: (task: ProjectTask) => void;
  onDelete?: (task: ProjectTask) => void;
  onDuplicate?: (task: ProjectTask) => void;
}) {
  return (
    <div className={boardLayout}>
      {columns.map((column) => (
        <BoardColumn
          key={column.id}
          column={column}
          allTasks={allTasks}
          statusesFor={statusesFor}
          onMove={onMove}
          onDrop={(task) => onDropColumn(task, column.id)}
          onSelect={onSelect}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
        />
      ))}
      {columns.length === 0 && (
        <MutedMessage className="w-full rounded-2xl border border-dashed p-10 text-center" message="Nothing to group yet." />
      )}
    </div>
  );
}
