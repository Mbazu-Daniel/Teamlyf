import { IconCalendar, IconCopy, IconDots, IconFlag, IconPin, IconTarget, IconTrash } from "@tabler/icons-react";
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
        {(onDelete || onDuplicate) && (
          {/* fallow-ignore-next-line code-duplication -- task card keeps the same task actions as the list view by design */}
          <details className="relative shrink-0">
            <summary className="list-none cursor-pointer rounded-md p-1 hover:bg-accent"><IconDots className="size-4 text-muted-foreground" /></summary>
            <div className="absolute right-0 z-30 mt-1 w-48 rounded-xl border bg-popover p-1.5 shadow-xl">
              <button type="button" onClick={() => onSelect(task)} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs hover:bg-accent">Edit</button>
              {onDuplicate && <button type="button" onClick={() => onDuplicate(task)} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs hover:bg-accent"><IconCopy className="size-3.5" />Duplicate</button>}
              <button type="button" className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs hover:bg-accent">Convert to subtask</button>
              <button type="button" className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs hover:bg-accent"><IconPin className="size-3.5" />Pin task to dashboard</button>
              <div className="my-1 border-t" />
              <button type="button" onClick={() => onDelete?.(task)} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-destructive hover:bg-destructive/10"><IconTrash className="size-3.5" />Delete</button>
            </div>
          </details>
        )}
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
