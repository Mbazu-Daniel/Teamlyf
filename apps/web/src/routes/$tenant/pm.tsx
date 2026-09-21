import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import {
  IconCalendar,
  IconCircleDashed,
  IconPlus,
  IconRefresh,
} from "@tabler/icons-react";
import { PageHeader } from "@/components/page-header";
import { Metric, StatusPill } from "@/components/workspace-ui";
import { AppDialog } from "@/components/app-dialog";
import { ResourceState } from "@/components/resource-state";
import { api, organizationPath, useApiResource } from "@/lib/api";

type Project = {
  id: string;
  name: string;
  identifier: string;
  description: string | null;
  emoji: string | null;
};
type Status = { id: string; name: string; group: string; color: string };
type Task = {
  id: string;
  name: string;
  description: string | null;
  statusId: string;
  priority: string;
  targetDate: string | null;
  taskAssignees: unknown[];
  createdAt: string;
};
type Activity = {
  id: string;
  verb: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
};
type Comment = { id: string; body: string; createdAt: string };
type Label = { id: string; name: string; color: string };
type Assignee = { id: string; name?: string; user?: { name?: string; email?: string }; capabilityType?: string };

export const Route = createFileRoute("/$tenant/pm")({ component: Projects });

function Projects() {
  const { tenant } = useParams({ strict: false }) as { tenant: string };
  const projects = useApiResource<Project[]>(
    organizationPath(tenant, "/projects"),
  );
  const [projectId, setProjectId] = useState("");
  const [newProject, setNewProject] = useState(false);
  const [newTask, setNewTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState("all");
  const [commentDraft, setCommentDraft] = useState("");
  const statuses = useApiResource<Status[]>(
    projectId
      ? organizationPath(tenant, `/projects/${projectId}/statuses`)
      : null,
  );
  const tasks = useApiResource<Task[]>(
    projectId ? organizationPath(tenant, `/projects/${projectId}/tasks`) : null,
  );
  const activity = useApiResource<Activity[]>(
    selectedTask && projectId
      ? organizationPath(
          tenant,
          `/projects/${projectId}/tasks/${selectedTask.id}/activity`,
        )
      : null,
  );
  const comments = useApiResource<Comment[]>(selectedTask && projectId ? organizationPath(tenant, `/projects/${projectId}/tasks/${selectedTask.id}/comments`) : null);
  const labels = useApiResource<Label[]>(projectId ? organizationPath(tenant, `/projects/${projectId}/labels`) : null);
  const members = useApiResource<Assignee[]>(organizationPath(tenant, "/members"));
  const agents = useApiResource<Assignee[]>(organizationPath(tenant, "/agents"));
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!projectId && projects.data?.[0]) setProjectId(projects.data[0].id);
  }, [projectId, projects.data]);
  const selectedProject = projects.data?.find(
    (project) => project.id === projectId,
  );
  const tasksByStatus = useMemo(
    () =>
      new Map(
        (statuses.data ?? []).map((status) => [
          status.id,
          (tasks.data ?? []).filter((task) => task.statusId === status.id && (filter === "all" || task.priority === filter)),
        ]),
      ),
    [statuses.data, tasks.data, filter],
  );
  const visibleStatuses = useMemo(
    () => (statuses.data ?? []).filter((status) => (tasksByStatus.get(status.id)?.length ?? 0) > 0),
    [statuses.data, tasksByStatus],
  );
  const statusTone = (group: string) => ({
    backlog: "bg-slate-200 text-slate-700",
    todo: "bg-sky-100 text-sky-700",
    in_progress: "bg-violet-100 text-violet-700",
    done: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-rose-100 text-rose-700",
  }[group] ?? "bg-amber-100 text-amber-700");

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setFormError("");
    try {
      const name = String(form.get("name"));
      const identifier = String(form.get("identifier")).toUpperCase();
      const created = await api<Project>(
        organizationPath(tenant, "/projects"),
        {
          method: "POST",
          body: JSON.stringify({
            name,
            identifier,
            description: String(form.get("description") || ""),
          }),
        },
      );
      setProjectId(created.id);
      setNewProject(false);
      await projects.reload();
    } catch (reason) {
      setFormError(
        reason instanceof Error ? reason.message : "Unable to create project",
      );
    } finally {
      setSubmitting(false);
    }
  }
  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setFormError("");
    try {
      await api<Task>(
        organizationPath(tenant, `/projects/${projectId}/tasks`),
        {
          method: "POST",
          body: JSON.stringify({
            name: String(form.get("name")),
            description: String(form.get("description") || ""),
            priority: String(form.get("priority")),
            statusId: String(form.get("statusId")),
            targetDate: String(form.get("targetDate") || undefined),
          }),
        },
      );
      setNewTask(false);
      await tasks.reload();
    } catch (reason) {
      setFormError(
        reason instanceof Error ? reason.message : "Unable to create task",
      );
    } finally {
      setSubmitting(false);
    }
  }
  async function moveTask(task: Task, statusId: string) {
    await api(
      organizationPath(tenant, `/projects/${projectId}/tasks/${task.id}`),
      { method: "PATCH", body: JSON.stringify({ statusId }) },
    );
    await tasks.reload();
  }
  async function updateTask(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!selectedTask) return; const form = new FormData(event.currentTarget); const token = String(form.get("assignee") || ""); const assignees = token ? [{ kind: token.split(":")[0], id: token.slice(token.indexOf(":") + 1) }] : []; const labelIds = form.getAll("labelIds").map(String); try { await api(organizationPath(tenant, `/projects/${projectId}/tasks/${selectedTask.id}`), { method: "PATCH", body: JSON.stringify({ name: String(form.get("name")), description: String(form.get("description") || ""), statusId: String(form.get("statusId")), priority: String(form.get("priority")), targetDate: String(form.get("targetDate") || undefined), assignees, labelIds }) }); await Promise.all([tasks.reload(), activity.reload()]); setFormError("Task saved."); } catch (reason) { setFormError(reason instanceof Error ? reason.message : "Unable to save task"); } }
  async function addComment(event: FormEvent) { event.preventDefault(); if (!selectedTask || !commentDraft.trim()) return; try { await api(organizationPath(tenant, `/projects/${projectId}/tasks/${selectedTask.id}/comments`), { method: "POST", body: JSON.stringify({ body: commentDraft.trim() }) }); setCommentDraft(""); await Promise.all([comments.reload(), activity.reload()]); } catch (reason) { setFormError(reason instanceof Error ? reason.message : "Unable to add comment"); } }

  return (
    <>
      <PageHeader
        title="Projects"
        description="Plan, assign, and move work forward with a clear record of every change."
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setNewProject(true)}
              className="h-8 rounded-lg border bg-white px-2.5 text-sm font-semibold"
            >
              New project
            </button>
            <button
              disabled={!projectId}
              onClick={() => setNewTask(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-violet-600 px-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              <IconPlus className="size-4" />
              New task
            </button>
          </div>
        }
      />
      <ResourceState
        loading={projects.loading}
        error={projects.error}
        onRetry={projects.reload}
        isEmpty={projects.data?.length === 0}
        emptyTitle="Start with a project"
        emptyCopy="Create a project to get statuses, tasks, assignees, activity, and milestones in one place."
      >
        <>
          <section className="mb-6 grid gap-4 sm:grid-cols-3">
            <Metric
              label="Projects"
              value={String(projects.data?.length ?? 0)}
              trend="Live workspace data"
            />
            <Metric
              label="Tasks"
              value={String(tasks.data?.length ?? 0)}
              trend="In selected project"
            />
            <Metric
              label="Completed"
              value={String(
                (tasks.data ?? []).filter(
                  (task) =>
                    statuses.data?.find((status) => status.id === task.statusId)
                      ?.group === "done",
                ).length,
              )}
              trend="Ready to ship"
            />
          </section>
          <section className="surface overflow-hidden rounded-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4 sm:px-5">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-violet-100 text-violet-700">
                  <IconCircleDashed className="size-5" />
                </span>
                <div>
                  <select
                    value={projectId}
                    onChange={(event) => setProjectId(event.target.value)}
                    className="bg-transparent text-base font-semibold outline-none"
                  >
                    {projects.data?.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.emoji ?? "◌"} {project.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    {selectedProject?.identifier} · {tasks.data?.length ?? 0}{" "}
                    tasks
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  void Promise.all([statuses.reload(), tasks.reload()])
                }
                className="inline-flex items-center gap-1 text-sm font-semibold text-violet-700"
              >
                <IconRefresh className="size-4" />
                Refresh
              </button>
              <select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-lg border bg-white px-2 py-1.5 text-xs font-semibold"><option value="all">All priorities</option><option value="urgent">Urgent</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option><option value="none">No priority</option></select>
            </div>
            <ResourceState
              loading={statuses.loading || tasks.loading}
              error={statuses.error ?? tasks.error}
              onRetry={() =>
                void Promise.all([statuses.reload(), tasks.reload()])
              }
              isEmpty={Boolean(statuses.data && statuses.data.length === 0)}
              emptyTitle="This project has no statuses"
            >
              <div className="grid gap-4 overflow-x-auto p-4 md:grid-cols-3 sm:p-5">
                {visibleStatuses.map((status) => (
                  <div
                    key={status.id}
                    className="min-w-64 rounded-xl bg-muted/55 p-3"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold ${statusTone(status.group)}`}>{status.name}</span>
                      <span className="text-xs font-medium text-muted-foreground">
                        {tasksByStatus.get(status.id)?.length ?? 0}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {tasksByStatus.get(status.id)?.map((task) => (
                        <article
                          key={task.id}
                          className="rounded-xl border border-white bg-white p-3.5 shadow-sm"
                        >
                          <button
                            onClick={() => setSelectedTask(task)}
                            className="w-full text-left"
                          >
                            <h3 className="text-sm font-semibold leading-5">
                              {task.name}
                            </h3>
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                              {task.description || "No description"}
                            </p>
                          </button>
                          <div className="mt-4 flex items-center justify-between">
                            <StatusPill
                              tone={
                                task.priority === "urgent" ||
                                task.priority === "high"
                                  ? "amber"
                                  : "sky"
                              }
                            >
                              {task.priority}
                            </StatusPill>
                            {task.targetDate && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <IconCalendar className="size-3.5" />
                                {new Date(task.targetDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <select
                            aria-label={`Move ${task.name}`}
                            value={task.statusId}
                            onChange={(event) =>
                              void moveTask(task, event.target.value)
                            }
                            className="mt-3 w-full rounded-lg border bg-white px-2 py-1.5 text-xs font-medium"
                          >
                            {statuses.data?.map((option) => (
                              <option key={option.id} value={option.id}>
                                Move to {option.name}
                              </option>
                            ))}
                          </select>
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ResourceState>
          </section>
        </>
      </ResourceState>
      {newProject && (
        <AppDialog
          title="Create a project"
          description="A project gets its own board, statuses, work history, and milestones."
          onClose={() => setNewProject(false)}
        >
          <form onSubmit={createProject} className="space-y-4">
            <Input name="name" label="Project name" required />
            <Input
              name="identifier"
              label="Short identifier"
              placeholder="BETA"
              required
            />
            <Input name="description" label="Description" />
            <FormActions
              onCancel={() => setNewProject(false)}
              submitting={submitting}
              label="Create project"
              error={formError}
            />
          </form>
        </AppDialog>
      )}
      {newTask && statuses.data && (
        <AppDialog
          title="Create a task"
          description="Give the team a clear, assignable next step."
          onClose={() => setNewTask(false)}
        >
          <form onSubmit={createTask} className="space-y-4">
            <Input name="name" label="Task name" required />
            <Input name="description" label="Description" />
            <label className="block text-sm font-semibold">
              Status
              <select
                name="statusId"
                defaultValue={statuses.data[0]?.id}
                className="mt-1.5 h-10 w-full rounded-xl border bg-white px-3 text-sm"
              >
                {statuses.data.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Priority
              <select
                name="priority"
                defaultValue="none"
                className="mt-1.5 h-10 w-full rounded-xl border bg-white px-3 text-sm"
              >
                <option value="none">No priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>
            <Input name="targetDate" label="Due date" type="date" />
            <FormActions
              onCancel={() => setNewTask(false)}
              submitting={submitting}
              label="Create task"
              error={formError}
            />
          </form>
        </AppDialog>
      )}
      {selectedTask && (
        <AppDialog
          title={selectedTask.name}
          description={selectedTask.description || "No task description yet."}
          onClose={() => setSelectedTask(null)}
        >
          <form onSubmit={updateTask} className="grid gap-3 sm:grid-cols-2"><label className="block text-sm font-semibold sm:col-span-2">Task name<input name="name" defaultValue={selectedTask.name} className="mt-1.5 h-10 w-full rounded-xl border px-3 text-sm" /></label><label className="block text-sm font-semibold sm:col-span-2">Description<textarea name="description" defaultValue={selectedTask.description ?? ""} className="mt-1.5 min-h-20 w-full rounded-xl border p-3 text-sm" /></label><label className="block text-sm font-semibold">Status<select name="statusId" defaultValue={selectedTask.statusId} className="mt-1.5 h-10 w-full rounded-xl border bg-white px-3 text-sm">{statuses.data?.map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}</select></label><label className="block text-sm font-semibold">Priority<select name="priority" defaultValue={selectedTask.priority} className="mt-1.5 h-10 w-full rounded-xl border bg-white px-3 text-sm">{["none", "low", "medium", "high", "urgent"].map((value) => <option key={value}>{value}</option>)}</select></label><label className="block text-sm font-semibold">Assignee<select name="assignee" className="mt-1.5 h-10 w-full rounded-xl border bg-white px-3 text-sm"><option value="">Unassigned</option><optgroup label="People">{members.data?.map((member) => <option key={member.id} value={`member:${member.id}`}>{member.user?.name ?? member.name ?? "Teammate"}</option>)}</optgroup><optgroup label="Agents">{agents.data?.map((agent) => <option key={agent.id} value={`agent:${agent.id}`}>{agent.name ?? "Agent"} · {agent.capabilityType}</option>)}</optgroup></select></label><label className="block text-sm font-semibold">Due date<input type="date" name="targetDate" defaultValue={selectedTask.targetDate?.slice(0, 10) ?? ""} className="mt-1.5 h-10 w-full rounded-xl border px-3 text-sm" /></label><label className="block text-sm font-semibold sm:col-span-2">Labels<select multiple name="labelIds" className="mt-1.5 h-20 w-full rounded-xl border bg-white p-2 text-sm">{labels.data?.map((label) => <option key={label.id} value={label.id}>{label.name}</option>)}</select></label><button className="sm:col-span-2 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white">Save task</button></form>
          <p className="eyebrow mt-6">Activity</p>
          <ResourceState
            loading={activity.loading}
            error={activity.error}
            onRetry={activity.reload}
            isEmpty={activity.data?.length === 0}
            emptyTitle="No activity yet"
          >
            {activity.data && (
              <ol className="mt-3 space-y-3">
                {activity.data.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl bg-muted/50 p-3 text-sm"
                  >
                    <strong>{item.verb}</strong>
                    {item.field && <> {item.field.replace("Id", "")}</>}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </ResourceState>
          <p className="eyebrow mt-6">Comments</p><ResourceState loading={comments.loading} error={comments.error} onRetry={comments.reload} isEmpty={comments.data?.length === 0} emptyTitle="No comments yet">{comments.data && <div className="mt-2 space-y-2">{comments.data.map((comment) => <article key={comment.id} className="rounded-xl bg-muted/50 p-3 text-sm"><p>{comment.body}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleString()}</p></article>)}</div>}</ResourceState><form onSubmit={addComment} className="mt-3 flex gap-2"><input value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} placeholder="Add a comment" className="min-w-0 flex-1 rounded-lg border px-3 text-sm" /><button className="rounded-lg bg-violet-600 px-3 text-xs font-semibold text-white">Comment</button></form>
        </AppDialog>
      )}
    </>
  );
}

function Input({
  name,
  label,
  type = "text",
  placeholder,
  required,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input
        name={name}
        required={required}
        type={type}
        placeholder={placeholder}
        className="mt-1.5 h-10 w-full rounded-xl border bg-white px-3 text-sm font-medium outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
      />
    </label>
  );
}
function FormActions({
  onCancel,
  submitting,
  label,
  error,
}: {
  onCancel: () => void;
  submitting: boolean;
  label: string;
  error: string;
}) {
  return (
    <>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 text-sm font-semibold"
        >
          Cancel
        </button>
        <button
          disabled={submitting}
          className="rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {submitting ? "Saving…" : label}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      )}
    </>
  );
}
