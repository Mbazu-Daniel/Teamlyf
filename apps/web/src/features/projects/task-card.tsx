import { IconCalendar, IconFlag, IconTarget } from "@tabler/icons-react";
import { TaskActionsMenu } from "./task-actions-menu";
import type { ProjectTask, Status } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const priorityTone: Record<string, string> = { urgent: "text-destructive", high: "text-orange-500", medium: "text-amber-500", low: "text-blue-500", none: "text-muted-foreground" };

export function TaskCard({ task, statuses, onMove, onSelect, onDelete, onDuplicate }: {
  task: ProjectTask;
  statuses: Status[];
  /** Omitted where a card cannot pick a status, so the select is never rendered dead. */
  onMove?: (task: ProjectTask, statusId: string) => void;
  onSelect: (task: ProjectTask) => void;
  onDelete?: (task: ProjectTask) => void;
  onDuplicate?: (task: ProjectTask) => void;
}) {
  return (
    <article draggable onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", task.id); }} className="group cursor-grab rounded-[14px] border border-border/65 bg-card p-4 shadow-none transition-colors duration-200 hover:border-primary/35 active:cursor-grabbing">
      <div className="flex items-start justify-between gap-2">
        <button type="button" aria-label={task.name} onClick={() => onSelect(task)} className="min-w-0 flex-1 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
          <span className="text-[10px] font-semibold text-muted-foreground">#{task.sequenceId}</span>
          <h3 className="mt-1.5 line-clamp-2 text-[13px] font-semibold leading-5">{task.name}</h3>
          {task.description && <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{task.description}</p>}
        </button>
        {(onDelete || onDuplicate) && <TaskActionsMenu task={task} onEdit={onSelect} onDelete={onDelete} onDuplicate={onDuplicate} />}
      </div>
      <div className="mt-4 flex min-h-7 flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <span className={`inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 font-medium ${priorityTone[task.priority] ?? priorityTone.none}`}><IconFlag className="size-3" />{task.priority}</span>
        {task.targetDate && <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1"><IconCalendar className="size-3" />{new Date(task.targetDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>}
        {(task.milestoneTasks?.length ?? 0) > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1"><IconTarget className="size-3" />{task.milestoneTasks?.length}</span>}
      </div>
      {onMove && (
        <div className="mt-3 border-t border-border/50 pt-3" onClick={(event) => event.stopPropagation()}>
          <Select value={task.statusId} items={Object.fromEntries(statuses.map((item) => [item.id, item.name]))} onValueChange={(value) => onMove(task, value)}>
            <SelectTrigger variant="compact" aria-label={`Status for ${task.name}`} className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>{statuses.map((item) => <SelectItem key={item.id} value={item.id}><span className="flex items-center gap-2"><span className="size-1.5 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span></SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
    </article>
  );
}
