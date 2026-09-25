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
    <article
      draggable
      onDragStart={(event) => event.dataTransfer.setData("text/plain", task.id)}
      className="cursor-grab rounded-xl border bg-background p-3 shadow-sm transition hover:border-primary/40 hover:shadow-md active:cursor-grabbing"
    >
      <button
        type="button"
        onClick={() => onSelect(task)}
        className="w-full text-left font-medium hover:underline"
      >
        {task.name}
      </button>
      <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">\n        <span className="rounded-full bg-muted px-2 py-0.5 font-medium">{task.priority}</span>\n        {task.targetDate && <span>{new Date(task.targetDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>}\n      </div>
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
