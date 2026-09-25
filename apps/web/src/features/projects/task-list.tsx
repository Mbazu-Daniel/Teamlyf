import { IconCalendar, IconChevronDown, IconFlag, IconMilestone } from "@tabler/icons-react";
import type { ProjectTask, Status } from "@/lib/api";
import { MutedMessage } from "./feedback";

const priorityTone: Record<string, string> = {
  urgent: "text-destructive",
  high: "text-orange-500",
  medium: "text-amber-500",
  low: "text-blue-500",
  none: "text-muted-foreground",
};

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

  const groups = statuses.map((status) => ({
    status,
    tasks: tasks.filter((task) => task.statusId === status.id),
  }));

  return (
    <div className="overflow-x-auto rounded-2xl border bg-card">
      <div className="min-w-[760px]">
        <div className="grid grid-cols-[minmax(0,1fr)_150px_120px_140px_90px] gap-3 border-b bg-muted/20 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          <span>Task</span>
          <span>Status</span>
          <span>Priority</span>
          <span>Target</span>
          <span>Milestone</span>
        </div>

        {groups.map(({ status, tasks: statusTasks }) => (
          <section key={status.id}>
            <div className="flex items-center gap-2 border-b bg-muted/10 px-4 py-2">
              <span className="size-2 rounded-full" style={{ backgroundColor: status.color }} />
              <span className="text-xs font-semibold">{status.name}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {statusTasks.length}
              </span>
            </div>

            {statusTasks.length === 0 ? (
              <div className="border-b px-4 py-4 text-xs text-muted-foreground">Nothing here</div>
            ) : (
              statusTasks.map((task) => (
                <div
                  key={task.id}
                  className="grid grid-cols-[minmax(0,1fr)_150px_120px_140px_90px] items-center gap-3 border-b px-4 py-3 transition hover:bg-muted/30"
                >
                  <button type="button" onClick={() => onSelect(task)} className="min-w-0 text-left">
                    <span className="flex items-center gap-2">
                      <span className="shrink-0 text-[10px] font-semibold tabular-nums text-muted-foreground">
                        #{task.sequenceId}
                      </span>
                      <span className="truncate text-sm font-medium">{task.name}</span>
                    </span>
                    {task.description && (
                      <span className="mt-1 block truncate pl-7 text-[10px] text-muted-foreground">{task.description}</span>
                    )}
                  </button>

                  <label className="relative">
                    <select
                      value={task.statusId}
                      onChange={(event) => onMove(task, event.target.value)}
                      className="w-full appearance-none rounded-lg border bg-background px-2.5 py-1.5 pr-7 text-xs"
                      aria-label={`Status for ${task.name}`}
                    >
                      {statuses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                    <IconChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
                  </label>

                  <span className={`inline-flex w-fit items-center gap-1 rounded-full bg-muted px-2 py-1 text-[10px] font-medium ${priorityTone[task.priority] ?? priorityTone.none}`}>
                    <IconFlag className="size-3" />
                    {task.priority}
                  </span>

                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <IconCalendar className="size-3.5" />
                    {task.targetDate ? new Date(task.targetDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "No date"}
                  </span>

                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <IconMilestone className="size-3.5" />
                    {task.milestoneTasks?.length ?? 0}
                  </span>
                </div>
              ))
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
