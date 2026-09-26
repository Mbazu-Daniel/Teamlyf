import type { ReactNode } from "react";
import type {
  OrganizationMember,
  Status,
  TaskAssigneeInput,
  TaskPriority,
  UpdateTaskInput,
} from "@/lib/api";
import { MutedMessage } from "./feedback";
import type { TaskDetail } from "./use-task-detail";

const PRIORITIES: readonly TaskPriority[] = ["urgent", "high", "medium", "low", "none"];

type TaskPropertiesProps = {
  task: TaskDetail;
  statuses: Status[];
  members: OrganizationMember[];
  membersLoading: boolean;
  updateTask: (input: UpdateTaskInput) => void;
};

export function TaskProperties({
  task,
  statuses,
  members,
  membersLoading,
  updateTask,
}: TaskPropertiesProps) {
  return (
    <section aria-label="Properties" className="rounded-xl border border-border/70 bg-card p-4 space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Properties</h3>
      <Field label="Status" htmlFor="task-status">
        <select
          id="task-status"
          value={task.statusId}
          onChange={(event) => updateTask({ statusId: event.target.value })}
          className="w-full rounded-md border bg-background px-2 py-2 text-sm"
        >
          {statuses.map((status) => (
            <option key={status.id} value={status.id}>
              {status.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Priority" htmlFor="task-priority">
        <select
          id="task-priority"
          value={task.priority}
          onChange={(event) => {
            const priority = PRIORITIES.find((item) => item === event.target.value);
            if (priority) updateTask({ priority });
          }}
          className="w-full rounded-md border bg-background px-2 py-2 text-sm"
        >
          {PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start date" htmlFor="task-start-date">
          <input
            id="task-start-date"
            type="date"
            value={toDateValue(task.startDate)}
            onChange={(event) => {
              // The API only accepts a date here ("" is rejected), so clearing is a no-op.
              if (event.target.value) updateTask({ startDate: event.target.value });
            }}
            className="w-full rounded-md border bg-background px-2 py-2 text-sm"
          />
        </Field>
        <Field label="Target date" htmlFor="task-target-date">
          <input
            id="task-target-date"
            type="date"
            value={toDateValue(task.targetDate)}
            onChange={(event) => {
              if (event.target.value) updateTask({ targetDate: event.target.value });
            }}
            className="w-full rounded-md border bg-background px-2 py-2 text-sm"
          />
        </Field>
      </div>
      <AssigneePicker
        task={task}
        members={members}
        membersLoading={membersLoading}
        updateTask={updateTask}
      />
    </section>
  );
}

function AssigneePicker({
  task,
  members,
  membersLoading,
  updateTask,
}: Pick<TaskPropertiesProps, "task" | "members" | "membersLoading" | "updateTask">) {
  const assigned = new Set(
    task.taskAssignees.flatMap((row) =>
      row.kind === "member" && row.memberId ? [row.memberId] : [],
    ),
  );

  if (membersLoading) return <MutedMessage message="Loading members..." />;
  if (!members.length)
    return <MutedMessage message="No members available to assign." />;

  function toggleMember(memberId: string, checked: boolean) {
    const next = new Set(assigned);
    if (checked) next.add(memberId);
    else next.delete(memberId);
    const assignees: TaskAssigneeInput[] = [...next].map((id) => ({ kind: "member", id }));
    updateTask({ assignees });
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold">Assignees</legend>
      {members.map((member) => (
        <label key={member.id} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={assigned.has(member.id)}
            onChange={(event) => toggleMember(member.id, event.target.checked)}
          />
          <span>{member.user?.name ?? member.user?.email ?? member.userId}</span>
        </label>
      ))}
    </fieldset>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="text-sm text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function toDateValue(date: string | null) {
  return date ? date.slice(0, 10) : "";
}
