import { IconCalendar, IconFlag, IconTarget } from "@tabler/icons-react";
import { TaskActionsMenu } from "./task-actions-menu";
import type { ProjectTask, Status } from "@/lib/api";

const priorityTone: Record<string, string> = { urgent: "text-destructive", high: "text-orange-500", medium: "text-amber-500", low: "text-blue-500", none: "text-muted-foreground" };

export function TaskCard({ task, statuses, onMove, onSelect, onDelete, onDuplicate }: {
  task: ProjectTask;
  statuses: Status[];
  onMove: (task: ProjectTask, statusId: string) => void;
  onSelect: (task: ProjectTask) => void;
  onDelete?: (task: ProjectTask) => void;
  onDuplicate?: (task: ProjectTask) => void;
}) {
  return (
    <article draggable onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", task.id); }} className="group cursor-grab rounded-xl border border-border/70 bg-card p-3.5 shadow-none transition-colors hover:border-primary/30 hover:bg-accent/20 active:cursor-grabbing">
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={() => onSelect(task)} className="min-w-0 flex-1 text-left">
          <span className="text-[10px] font-semibold text-muted-foreground">#{task.sequenceId}</span>
          <h3 className="mt-1 line-clamp-2 text-sm font-medium leading-snug">{task.name}</h3>
          {task.description && <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-muted-foreground">{task.description}</p>}
        </button>
        {(onDelete || onDuplicate) && <TaskActionsMenu task={task} onEdit={onSelect} onDelete={onDelete} onDuplicate={onDuplicate} />}
      </div>
      <div className="mt-3 flex min-h-7 flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
        <span className={`inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 font-medium ${priorityTone[task.priority] ?? priorityTone.none}`}><IconFlag className="size-3" />{task.priority}</span>
        {task.targetDate && <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1"><IconCalendar className="size-3" />{new Date(task.targetDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>}
        {(task.milestoneTasks?.length ?? 0) > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1"><IconTarget className="size-3" />{task.milestoneTasks?.length}</span>}
      </div>
      <select value={task.statusId} onChange={(event) => onMove(task, event.target.value)} onClick={(event) => event.stopPropagation()} className="mt-3 w-full rounded-lg border bg-background px-2.5 py-2 text-xs outline-none focus:border-primary" aria-label={`Status for ${task.name}`}>
        {statuses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
    </article>
  );
}
