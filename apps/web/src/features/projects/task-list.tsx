import type { ProjectTask, Status } from "@/lib/api";
import { IconChevronDown, IconCircleCheck, IconClock } from "@tabler/icons-react";
import { MutedMessage } from "./feedback";

export function TaskList({
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
  if (!tasks.length) {
    return <MutedMessage className="rounded-2xl border border-dashed p-10 text-center" message="No tasks match your current view." />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="grid grid-cols-[minmax(0,1fr)_150px_120px_130px] gap-3 border-b bg-muted/20 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <span>Task</span>
        <span>Status</span>
        <span>Priority</span>
        <span>Target</span>
      </div>
      <div className="divide-y">
        {tasks.map((task) => (
          <div key={task.id} className="grid grid-cols-[minmax(0,1fr)_150px_120px_130px] items-center gap-3 px-4 py-3 transition hover:bg-muted/30">
            <button type="button" onClick={() => onSelect(task)} className="min-w-0 text-left">
              <span className="block truncate text-sm font-medium">{task.name}</span>
              <span className="mt-0.5 block text-[10px] text-muted-foreground">{task.id}</span>
            </button>
            <label className="relative">
              <select
                value={task.statusId}
                onChange={(event) => onMove(task, event.target.value)}
                className="w-full appearance-none rounded-lg border bg-background px-2.5 py-1.5 pr-7 text-xs"
                aria-label={`Status for ${task.name}`}
              >
                {statuses.map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}
              </select>
              <IconChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
            </label>
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-muted px-2 py-1 text-[10px] font-medium">
              {task.priority === "none" ? <IconCircleCheck className="size-3" /> : <IconClock className="size-3" />}
              {task.priority}
            </span>
            <span className="text-xs text-muted-foreground">
              {task.targetDate ? new Date(task.targetDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "No date"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
