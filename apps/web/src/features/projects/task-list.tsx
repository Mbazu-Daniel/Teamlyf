import { useState } from "react";
import { IconChevronDown, IconFlag, IconPlus } from "@tabler/icons-react";
import { TaskActionsMenu } from "./task-actions-menu";
import type { ProjectTask, Status } from "@/lib/api";
import { MutedMessage } from "./feedback";

const priorityTone: Record<string, string> = { urgent: "text-destructive", high: "text-orange-500", medium: "text-amber-500", low: "text-blue-500", none: "text-muted-foreground" };

export function TaskList({ tasks, statuses, onMove, onSelect, onDelete, onDuplicate, onAddTask }: {
  tasks: ProjectTask[];
  statuses: Status[];
  onMove: (task: ProjectTask, statusId: string) => void;
  onSelect: (task: ProjectTask) => void;
  onDelete?: (task: ProjectTask) => void;
  onDuplicate?: (task: ProjectTask) => void;
  onAddTask?: (statusId: string) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => Object.fromEntries(statuses.map((status) => [status.id, true])));

  if (!tasks.length) return <MutedMessage className="rounded-2xl border border-dashed p-10 text-center" message="No tasks match your current view." />;

  return (
    <div className="flex w-full flex-col overflow-y-auto bg-background">
      {statuses.map((status) => {
        const group = tasks.filter((task) => task.statusId === status.id);
        const open = expanded[status.id] ?? true;
        return (
          <section key={status.id} className="border-b border-border/50">
            <div className="sticky top-0 z-10 flex cursor-pointer items-center gap-3 border-b bg-secondary/80 px-6 py-4 backdrop-blur-sm hover:bg-accent" onClick={() => setExpanded((current) => ({ ...current, [status.id]: !open }))}>
              <span className="size-3 rounded-full border-2" style={{ borderColor: status.color }} />
              <span className="text-sm font-semibold">{status.name.replace(/_/g, " ").replace(/^./, (value) => value.toUpperCase())}</span>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">{group.length}</span>
              <span className="ml-auto"><IconChevronDown className={`size-4 text-muted-foreground transition-transform ${open ? "" : "-rotate-90"}`} /></span>
              {onAddTask && <button type="button" aria-label="Add task" onClick={(event) => { event.stopPropagation(); onAddTask(status.id); }} className="rounded-md p-1 hover:bg-accent"><IconPlus className="size-4 text-muted-foreground" /></button>}
            </div>
            /* fallow-ignore-next-line code-duplication -- task actions intentionally mirror the card menu for interaction parity */
            {open && (group.length ? group.map((task) => (
              <div key={task.id} onClick={() => onSelect(task)} className="flex cursor-pointer items-center justify-between border-b border-border/30 px-6 py-3 transition-colors hover:bg-accent/50">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <span className="min-w-fit text-xs font-semibold text-muted-foreground">#{task.sequenceId}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{task.name}</span>
                </div>
                <div className="ml-4 flex shrink-0 items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 rounded border border-border bg-secondary/50 px-1.5 py-0.5 text-[10px] font-medium ${priorityTone[task.priority] ?? priorityTone.none}`}><IconFlag className="size-3.5" />{task.priority}</span>
                  <span className="hidden text-[10px] text-muted-foreground sm:inline">{task.targetDate ? new Date(task.targetDate).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "No date"}</span>
                  <select value={task.statusId} onChange={(event) => { event.stopPropagation(); onMove(task, event.target.value); }} onClick={(event) => event.stopPropagation()} className="max-w-32 rounded-md border bg-background px-2 py-1 text-[10px]">
                    {statuses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                  {(onDelete || onDuplicate) && <TaskActionsMenu task={task} onEdit={onSelect} onDelete={onDelete} onDuplicate={onDuplicate} />}
                </div>
              </div>
            )) : <div className="px-6 py-6 text-xs font-medium text-muted-foreground">No tasks</div>)}
          </section>
        );
      })}
    </div>
  );
}
