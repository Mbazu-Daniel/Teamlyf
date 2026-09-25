import type { Status, ProjectTask } from "@/lib/api";

export function TaskCard({
  task,
  statuses,
  onMove,
  onSelect,
}: {
  task: ProjectTask;
  statuses: Status[];
  onMove: (task: ProjectTask, statusId: string) => void;
  onSelect: (task: ProjectTask) => void;
}) {
  return (
    <article className="rounded-lg border bg-background p-3">
      <button
        type="button"
        onClick={() => onSelect(task)}
        className="w-full text-left font-medium hover:underline"
      >
        {task.name}
      </button>
      <p className="mt-1 text-xs text-muted-foreground">{task.priority}</p>
      <select
        value={task.statusId}
        onChange={(event) => void onMove(task, event.target.value)}
        className="mt-3 rounded-md border bg-background px-2 py-1 text-xs"
      >
        {statuses.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </article>
  );
}
