import type { Status, ProjectTask } from "@/lib/api";
import { MutedMessage } from "./feedback";
import { TaskCard } from "./task-card";

export function StatusColumn({
  status,
  tasks,
  statuses,
  onMove,
  onSelect,
}: {
  status: Status;
  tasks: ProjectTask[];
  statuses: Status[];
  onMove: (task: ProjectTask, statusId: string) => void;
  onSelect: (task: ProjectTask) => void;
}) {
  const statusTasks = tasks.filter((task) => task.statusId === status.id);

  return (
    <section
      className="flex min-h-[420px] w-[280px] shrink-0 flex-col rounded-2xl border bg-muted/20 p-2"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const taskId = event.dataTransfer.getData("text/plain");
        const task = tasks.find((item) => item.id === taskId);
        if (task) onMove(task, status.id);
      }}
    >
      <div className="flex items-center justify-between px-2 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="size-2 rounded-full" style={{ backgroundColor: status.color }} aria-hidden="true" />
          <h2 className="truncate text-xs font-semibold">{status.name}</h2>
        </div>
        <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{statusTasks.length}</span>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-1 pb-1">
        {statusTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            statuses={statuses}
            onMove={onMove}
            onSelect={onSelect}
          />
        ))}
        {statusTasks.length === 0 && <MutedMessage className="rounded-xl border border-dashed p-5 text-center text-xs" message="Drop tasks here" />}
      </div>
    </section>
  );
}

export function KanbanBoard({
  statuses,
  tasks,
  onMove,
  onSelect,
}: {
  statuses: Status[];
  tasks: ProjectTask[];
  onMove: (task: ProjectTask, statusId: string) => void;
  onSelect: (task: ProjectTask) => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-3">
      {statuses.map((status) => (
        <StatusColumn key={status.id} status={status} tasks={tasks} statuses={statuses} onMove={onMove} onSelect={onSelect} />
      ))}
      {statuses.length === 0 && <MutedMessage className="rounded-xl border border-dashed p-8" message="No workflow statuses configured." />}
    </div>
  );
}
