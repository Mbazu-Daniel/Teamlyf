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
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">{status.name}</h2>
        <span className="text-xs text-muted-foreground">{statusTasks.length}</span>
      </div>
      <div className="mt-3 space-y-2">
        <TaskCards tasks={statusTasks} statuses={statuses} onMove={onMove} onSelect={onSelect} />
        {statusTasks.length === 0 && <MutedMessage className="py-3" message="No tasks" />}
      </div>
    </div>
  );
}

function TaskCards({
  tasks,
  statuses,
  onMove,
  onSelect,
}: {
  tasks: ProjectTask[];
  statuses: Status[];
  onMove: (task: ProjectTask, statusId: string) => void;
  onSelect: (task: ProjectTask) => void;
}) {
  return (
    <>
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          statuses={statuses}
          onMove={onMove}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}
