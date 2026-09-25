import { Skeleton } from "@/components/ui/skeleton";
import type { TaskActivity as ActivityEntry } from "@/lib/api";
import { ErrorMessage, MutedMessage } from "./feedback";
import { formatRelativeTime } from "./relative-time";
import { useTaskActivity } from "./use-task-activity";

type TaskActivityProps = {
  organizationId: string;
  projectId: string;
  taskId: string;
};

export function TaskActivity({ organizationId, projectId, taskId }: TaskActivityProps) {
  const timeline = useTaskActivity(organizationId, projectId, taskId);

  return (
    <section aria-label="Activity" className="space-y-3 border-t pt-6">
      <h3 className="text-sm font-semibold">Activity</h3>
      <ActivityBody timeline={timeline} />
    </section>
  );
}

function ActivityBody({ timeline }: { timeline: ReturnType<typeof useTaskActivity> }) {
  if (timeline.loading) return <Skeleton className="h-20 w-full" />;
  if (timeline.error) {
    return (
      <div className="space-y-2">
        <ErrorMessage message={timeline.error} />
        <button
          type="button"
          onClick={timeline.retry}
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
        >
          Try again
        </button>
      </div>
    );
  }
  if (!timeline.activities.length) return <MutedMessage message="No activity yet" />;

  return (
    <ol className="space-y-1.5">
      {timeline.activities.map((entry) => (
        <li key={entry.id} className="flex items-baseline justify-between gap-3 text-sm">
          <span className="min-w-0">{describeActivity(entry)}</span>
          <time dateTime={entry.createdAt} className="shrink-0 text-xs text-muted-foreground">
            {formatRelativeTime(entry.createdAt)}
          </time>
        </li>
      ))}
    </ol>
  );
}

const FIELD_LABELS: Record<string, string> = {
  statusId: "status",
  name: "name",
  description: "description",
  priority: "priority",
  startDate: "start date",
  targetDate: "target date",
  assignees: "assignees",
};

/**
 * One readable sentence per activity row. Verbs and fields outside the known
 * set keep their own wording (humanized) instead of rendering as raw ids.
 */
function describeActivity(activity: ActivityEntry): string {
  if (activity.verb === "created") return "created this task";

  const subject = activity.field
    ? (FIELD_LABELS[activity.field] ?? humanize(activity.field))
    : null;
  const verb = humanize(activity.verb);

  if (!subject) return `${verb} this task`;
  if (!activity.newValue) {
    return activity.verb === "updated" ? `${subject} cleared` : `${verb} ${subject}`;
  }
  if (activity.verb === "updated") return `${subject} changed to ${activity.newValue}`;
  return `${verb} ${subject} to ${activity.newValue}`;
}

/** statusId → "status id", due_date → "due date", so ids read as prose. */
function humanize(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .toLowerCase();
}
