import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type {
  Agent,
  OrganizationMember,
  Status,
  TaskAssigneeInput,
  TaskPriority,
  UpdateTaskInput,
} from "@/lib/api";
import { agentsApi } from "@/lib/api";
import { MutedMessage } from "./feedback";
import type { TaskDetail } from "./use-task-detail";

const PRIORITIES: readonly TaskPriority[] = ["urgent", "high", "medium", "low", "none"];

type TaskPropertiesProps = {
  organizationId: string;\n  task: TaskDetail;
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
    <section aria-label="Properties" className="space-y-4 rounded-xl border border-border/70 bg-card p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Properties</h3>
      <Field label="Status" htmlFor="task-status">
        <select id="task-status" value={task.statusId} onChange={(event) => updateTask({ statusId: event.target.value })} className="w-full rounded-md border bg-background px-2 py-2 text-sm">
          {statuses.map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}
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
          {PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start date" htmlFor="task-start-date">
          <input id="task-start-date" type="date" value={toDateValue(task.startDate)} onChange={(event) => { if (event.target.value) updateTask({ startDate: event.target.value }); }} className="w-full rounded-md border bg-background px-2 py-2 text-sm" />
        </Field>
        <Field label="Target date" htmlFor="task-target-date">
          <input id="task-target-date" type="date" value={toDateValue(task.targetDate)} onChange={(event) => { if (event.target.value) updateTask({ targetDate: event.target.value }); }} className="w-full rounded-md border bg-background px-2 py-2 text-sm" />
        </Field>
      </div>
      <AssigneePicker organizationId={organizationId} projectId={task.projectId} task={task} members={members} membersLoading={membersLoading} updateTask={updateTask} />
    </section>
  );
}

function AssigneePicker({
  organizationId,
  projectId,
  task,
  members,
  membersLoading,
  updateTask,
}: Pick<TaskPropertiesProps, "task" | "members" | "membersLoading" | "updateTask"> & {
  organizationId: string;
  projectId: string;
}) {
  const { data: agents, isPending: agentsLoading } = useQuery({
    queryKey: ["agents", organizationId],
    queryFn: () => agentsApi.list(organizationId),
    enabled: Boolean(organizationId),
    retry: false,
  });

  const assignedAgentIds = task.taskAssignees.flatMap((row) => row.kind === "agent" && row.agentId ? [row.agentId] : []);
  const { data: agentRuns = [] } = useQuery({
    queryKey: ["agent-runs", organizationId, [...assignedAgentIds].sort()],
    queryFn: async () => {
      const runs = await Promise.all(assignedAgentIds.map((agentId) => agentsApi.runs(organizationId, agentId)));
      return runs.flat();
    },
    enabled: Boolean(organizationId && assignedAgentIds.length),
    refetchInterval: 5000,
    retry: false,
  });
  const activeRuns = agentRuns.filter((run) => {
    if (run.status !== "queued" && run.status !== "running") return false;
    const input = run.input;
    return typeof input === "object" && input !== null && "taskId" in input && input.taskId === task.id;
  });

  const assignedMembers = new Set(
    task.taskAssignees.flatMap((row) => row.kind === "member" && row.memberId ? [row.memberId] : []),
  );
  const assignedAgents = new Set(
    task.taskAssignees.flatMap((row) => row.kind === "agent" && row.agentId ? [row.agentId] : []),
  );

  if (membersLoading || agentsLoading) return <MutedMessage message="Loading assignees..." />;
  if (!members.length && !(agents?.length)) return <MutedMessage message="No members or agents available to assign." />;

  function saveAssignees(nextMembers: Set<string>, nextAgents: Set<string>, runAgentId?: string) {
    const assignees: TaskAssigneeInput[] = [
      ...[...nextMembers].map((id) => ({ kind: "member" as const, id })),
      ...[...nextAgents].map((id) => ({ kind: "agent" as const, id })),
    ];
    updateTask({ assignees });

    if (runAgentId) {
      void agentsApi.run(organizationId, runAgentId, {
        taskId: task.id,
        projectId,
        taskName: task.name,
        description: task.description,
        instruction: "Work on this assigned task. Inspect the available Teamlyf context, take the actions you are permitted to take, and report the work and any blockers.",
      });
    }
  }

  function toggleMember(memberId: string, checked: boolean) {
    const next = new Set(assignedMembers);
    if (checked) next.add(memberId);
    else next.delete(memberId);
    saveAssignees(next, new Set(assignedAgents));
  }

  function toggleAgent(agentId: string, checked: boolean) {
    const next = new Set(assignedAgents);
    if (checked) next.add(agentId);
    else next.delete(agentId);
    saveAssignees(new Set(assignedMembers), next, checked ? agentId : undefined);
  }

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold">Assignees</legend>
      <div className="space-y-1">
        {members.map((member) => (
          <label key={member.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60">
            <input type="checkbox" checked={assignedMembers.has(member.id)} onChange={(event) => toggleMember(member.id, event.target.checked)} />
            <span className="truncate">{member.user?.name ?? member.user?.email ?? member.userId}</span>
          </label>
        ))}
      </div>
      {!!agents?.length && (
        <div className="border-t pt-3">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">AI agents</p>
          {agents.filter((agent) => agent.enabled).map((agent: Agent) => (
            <label key={agent.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60">
              <input type="checkbox" checked={assignedAgents.has(agent.id)} onChange={(event) => toggleAgent(agent.id, event.target.checked)} />
              <span className="truncate">🤖 {agent.name}</span>
            </label>
          ))}
          <p className="mt-2 text-[11px] leading-4 text-muted-foreground">
            Assigning an enabled agent starts a run with this task as its work context.
          </p>
        </div>
      )}
    </fieldset>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="text-sm text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function toDateValue(date: string | null) {
  return date ? date.slice(0, 10) : "";
}
