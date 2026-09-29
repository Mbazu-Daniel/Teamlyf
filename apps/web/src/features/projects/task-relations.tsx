import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import type { OrganizationMember, TaskRelationType } from "@/lib/api";
import { projectsApi, TASK_RELATION_TYPES } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { ErrorMessage, MutedMessage } from "./feedback";
import { useTaskRelations, useTaskSubscribers } from "./use-task-relations";

type TaskRelationsProps = {
  organizationId: string;
  projectId: string;
  taskId: string;
  members: OrganizationMember[];
  membersLoading: boolean;
};

/**
 * The task's outward graph: links to other tasks and the members watching it.
 * Both lists follow the same shape — read a list, mutate, invalidate — so they
 * live in one hook file but render as two independent sections.
 */
export function TaskRelations({
  organizationId,
  projectId,
  taskId,
  members,
  membersLoading,
}: TaskRelationsProps) {
  return (
    <>
      <RelationsSection
        organizationId={organizationId}
        projectId={projectId}
        taskId={taskId}
      />
      <SubscribersSection
        organizationId={organizationId}
        projectId={projectId}
        taskId={taskId}
        members={members}
        membersLoading={membersLoading}
      />
    </>
  );
}

/** Labels read from this task's seat: outgoing rows say what this task suffers. */
const OUTGOING_LABELS: Record<TaskRelationType, string> = {
  BLOCKED_BY: "Blocked by",
  RELATED_TO: "Related to",
  DUPLICATE_OF: "Duplicate of",
};

/** Incoming rows are the same link read backwards: this task is the target. */
const INCOMING_LABELS: Record<TaskRelationType, string> = {
  BLOCKED_BY: "Blocks",
  RELATED_TO: "Related to",
  DUPLICATE_OF: "Duplicated by",
};

function RelationsSection({
  organizationId,
  projectId,
  taskId,
}: Pick<TaskRelationsProps, "organizationId" | "projectId" | "taskId">) {
  const relations = useTaskRelations(organizationId, projectId, taskId);
  const [targetTaskId, setTargetTaskId] = useState("");
  const [relationType, setRelationType] = useState<TaskRelationType>("RELATED_TO");

  // The board already caches this key, so the picker reuses its data.
  const tasksQuery = useQuery({
    queryKey: queryKeys.tasks(organizationId, projectId),
    queryFn: () => projectsApi.getTasks(organizationId, projectId),
    enabled: Boolean(organizationId),
    retry: false,
  });
  const candidates = (tasksQuery.data ?? []).filter((item) => item.id !== taskId);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!targetTaskId || relations.creating) return;
    relations.addRelation({ targetTaskId, relationType });
    setTargetTaskId("");
  }

  return (
    <section aria-label="Relations" className="space-y-3 rounded-xl border border-border/70 bg-card p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Relations
      </h3>
      {relations.loading && <MutedMessage message="Loading relations..." />}
      {!!relations.error && (
        <div className="space-y-2">
          <ErrorMessage message={relations.error} />
          <button
            type="button"
            onClick={relations.retry}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
          >
            Try again
          </button>
        </div>
      )}
      {!relations.loading && !relations.relations.length && (
        <MutedMessage message="No relations yet." />
      )}
      <ul className="space-y-1">
        {relations.relations.map((relation) => {
          const outgoing = relation.sourceTaskId === taskId;
          const other = outgoing ? relation.targetTask : relation.sourceTask;
          const label = (outgoing ? OUTGOING_LABELS : INCOMING_LABELS)[relation.relationType];
          return (
            <li
              key={relation.id}
              className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60"
            >
              <span className="min-w-0 truncate">
                <span className="text-muted-foreground">{label}</span>{" "}
                {other && (
                  <>
                    <span className="font-medium">#{other.sequenceId}</span> {other.name}
                  </>
                )}
              </span>
              <button
                type="button"
                onClick={() => relations.deleteRelation(relation.id)}
                className="shrink-0 rounded-md px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={`Remove relation ${label}`}
              >
                Remove
              </button>
            </li>
          );
        })}
      </ul>
      {!!relations.createError && <ErrorMessage message={relations.createError} />}
      {!!relations.deleteError && <ErrorMessage message={relations.deleteError} />}
      {candidates.length > 0 && (
        <form onSubmit={submit} className="flex flex-wrap items-center gap-2 border-t pt-3">
          <select
            value={targetTaskId}
            onChange={(event) => setTargetTaskId(event.target.value)}
            aria-label="Target task"
            className="min-w-0 flex-1 rounded-md border bg-background px-2 py-2 text-sm"
          >
            <option value="">Link to task...</option>
            {candidates.map((item) => (
              <option key={item.id} value={item.id}>
                #{item.sequenceId} {item.name}
              </option>
            ))}
          </select>
          <select
            value={relationType}
            onChange={(event) => setRelationType(event.target.value as TaskRelationType)}
            aria-label="Relation type"
            className="rounded-md border bg-background px-2 h-control py-0 text-sm"
          >
            {TASK_RELATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {OUTGOING_LABELS[type]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!targetTaskId || relations.creating}
            className="rounded-lg bg-primary px-3 h-control py-0 text-xs font-semibold text-primary-foreground disabled:opacity-50"
          >
            {relations.creating ? "Adding..." : "Add"}
          </button>
        </form>
      )}
    </section>
  );
}

function SubscribersSection({
  organizationId,
  projectId,
  taskId,
  members,
  membersLoading,
}: TaskRelationsProps) {
  const subscribers = useTaskSubscribers(organizationId, projectId, taskId);
  const [memberId, setMemberId] = useState("");

  const subscribedIds = new Set(subscribers.subscribers.map((row) => row.memberId));
  const available = members.filter((item) => !subscribedIds.has(item.id));

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!memberId) return;
    subscribers.subscribe(memberId);
    setMemberId("");
  }

  return (
    <section aria-label="Subscribers" className="space-y-3 rounded-xl border border-border/70 bg-card p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Subscribers
      </h3>
      {subscribers.loading && <MutedMessage message="Loading subscribers..." />}
      {!!subscribers.error && (
        <div className="space-y-2">
          <ErrorMessage message={subscribers.error} />
          <button
            type="button"
            onClick={subscribers.retry}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
          >
            Try again
          </button>
        </div>
      )}
      {!subscribers.loading && !subscribers.subscribers.length && (
        <MutedMessage message="Nobody is watching this task yet." />
      )}
      <ul className="space-y-1">
        {subscribers.subscribers.map((row) => (
          <li
            key={row.id}
            className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60"
          >
            <span className="min-w-0 truncate">{subscriberLabel(row.member, row.memberId)}</span>
            <button
              type="button"
              onClick={() => subscribers.unsubscribe(row.memberId)}
              className="shrink-0 rounded-md px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={`Unsubscribe ${subscriberLabel(row.member, row.memberId)}`}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      {!!subscribers.subscribeError && <ErrorMessage message={subscribers.subscribeError} />}
      {!!subscribers.unsubscribeError && (
        <ErrorMessage message={subscribers.unsubscribeError} />
      )}
      {membersLoading && <MutedMessage message="Loading members..." />}
      {!membersLoading && available.length > 0 && (
        <form onSubmit={submit} className="flex flex-wrap items-center gap-2 border-t pt-3">
          <select
            value={memberId}
            onChange={(event) => setMemberId(event.target.value)}
            aria-label="Member to subscribe"
            className="min-w-0 flex-1 rounded-md border bg-background px-2 py-2 text-sm"
          >
            <option value="">Subscribe a member...</option>
            {available.map((member) => (
              <option key={member.id} value={member.id}>
                {member.user?.name ?? member.user?.email ?? member.userId}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!memberId}
            className="rounded-lg bg-primary px-3 h-control py-0 text-xs font-semibold text-primary-foreground disabled:opacity-50"
          >
            Add
          </button>
        </form>
      )}
    </section>
  );
}

/** Joined member names when present, id prefix as the last resort. */
function subscriberLabel(
  member: { firstName: string | null; lastName: string | null; userId: string | null } | null,
  fallbackId: string,
) {
  const name = member ? [member.firstName, member.lastName].filter(Boolean).join(" ") : "";
  return name || member?.userId || fallbackId;
}
