import { IconCalendar, IconFlag, IconTarget } from "@tabler/icons-react";
import type { ProjectTask, Status } from "@/lib/api";

const priorityTone: Record<string, string> = {
  urgent: "text-destructive",
  high: "text-orange-500",
  medium: "text-amber-500",
  low: "text-blue-500",
  none: "text-muted-foreground",
};

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
  const milestoneCount = task.milestoneTasks?.length ?? 0;
  const assigneeCount = task.taskAssignees?.length ?? 0;

  return (
    <article
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", task.id);
      }}
      className="group cursor-grab rounded-xl border bg-background p-3 shadow-sm transition hover:border-primary/40 hover:shadow-md active:cursor-grabbing"
    >
      <button type="button" onClick={() => onSelect(task)} className="block w-full text-left">
        <div className="flex items-start gap-2">
          <span className="pt-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
            #{task.sequenceId}
          </span>
          <span className="min-w-0 flex-1 text-sm font-medium leading-5 group-hover:text-primary">
            {task.name}
          </span>
        </div>
        {task.description && (
          <p className="mt-1.5 line-clamp-2 text-[11px] leading-4 text-muted-foreground">
            {task.description}
          </p>
        )}
      </button>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
        <span className={`inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 font-medium ${priorityTone[task.priority] ?? priorityTone.none}`}>
          <IconFlag className="size-3" />
          {task.priority}
        </span>
        {task.targetDate && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
            <IconCalendar className="size-3" />
            {new Date(task.targetDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        )}
        {milestoneCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
            <IconMilestone className="size-3" />
            {milestoneCount}
          </span>
        )}
        {assigneeCount > 0 && (
          <span className="ml-auto rounded-full bg-muted px-2 py-1">
            {assigneeCount} {assigneeCount === 1 ? "assignee" : "assignees"}
          </span>
        )}
      </div>

      <select
        value={task.statusId}
        onChange={(event) => void onMove(task, event.target.value)}
        onClick={(event) => event.stopPropagation()}
        className="mt-3 w-full rounded-lg border bg-background px-2.5 py-1.5 text-xs"
        aria-label={`Status for ${task.name}`}
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
