import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useOrganization } from "@/lib/organization";

type Project = { id: string; name: string; identifier: string; description: string | null; emoji: string | null };
type Status = { id: string; name: string; group: string };
type Task = { id: string; name: string; description: string | null; priority: string; statusId: string; targetDate: string | null };

export const Route = createFileRoute("/projects/$projectId")({ component: ProjectPage });

function ProjectPage() {
  const { projectId } = Route.useParams();
  const { organization } = useOrganization();
  const state = useProjectPage(organization?.id, projectId);

  if (!organization) return <EmptyProjectState />;
  if (!state.project) return <LoadingProjectState error={state.error} />;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <ProjectHeader project={state.project} />
      <TaskForm
        name={state.name}
        statusId={state.statusId}
        statuses={state.statuses}
        loading={state.loading}
        onNameChange={state.setName}
        onStatusChange={state.setStatusId}
        onSubmit={state.createTask}
      />
      {state.error && <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{state.error}</p>}
      <section className="mt-8 space-y-6">
        {state.statuses.map((status) => (
          <StatusColumn key={status.id} status={status} tasks={state.tasks} statuses={state.statuses} onMove={state.moveTask} />
        ))}
      </section>
    </main>
  );
}

function useProjectPage(organizationId: string | undefined, projectId: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [name, setName] = useState("");
  const [statusId, setStatusId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (organizationId) void loadProject(organizationId, projectId);
  }, [organizationId, projectId]);

  async function loadProject(orgId: string, id: string) {
    setError(null);
    try {
      const prefix = `/organization/${orgId}/projects/${id}`;
      const [projectData, statusData, taskData] = await Promise.all([
        api<Project>(prefix),
        api<Status[]>(`${prefix}/statuses`),
        api<Task[]>(`${prefix}/tasks`),
      ]);
      setProject(projectData);
      setStatuses(statusData);
      setStatusId((current) => current || statusData[0]?.id || "");
      setTasks(taskData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load project");
    }
  }

  async function createTask(event: React.FormEvent) {
    event.preventDefault();
    if (!organizationId || !name.trim() || !statusId) return;
    setLoading(true);
    setError(null);
    try {
      const task = await api<Task>(`/organization/${organizationId}/projects/${projectId}/tasks`, {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), statusId }),
      });
      setTasks((current) => [...current, task]);
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create task");
    } finally {
      setLoading(false);
    }
  }

  async function moveTask(task: Task, nextStatusId: string) {
    if (!organizationId || task.statusId === nextStatusId) return;
    setError(null);
    try {
      const updated = await api<Task>(`/organization/${organizationId}/projects/${projectId}/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ statusId: nextStatusId }),
      });
      setTasks((current) => current.map((item) => item.id === task.id ? updated : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update task");
    }
  }

  return { project, statuses, tasks, name, statusId, loading, error, setName, setStatusId, createTask, moveTask };
}

function EmptyProjectState() {
  return <main className="mx-auto max-w-6xl px-6 py-12"><h1 className="text-2xl font-semibold">Project</h1><p className="mt-2 text-muted-foreground">Select an organization first.</p></main>;
}

function LoadingProjectState({ error }: { error: string | null }) {
  return <main className="mx-auto max-w-6xl px-6 py-12"><p className="text-sm text-muted-foreground">{error ?? "Loading project..."}</p></main>;
}

function ProjectHeader({ project }: { project: Project }) {
  return (
    <>
      <Link to="/projects" className="text-sm text-muted-foreground hover:text-foreground">← Projects</Link>
      <header className="mt-6">
        <p className="text-sm text-muted-foreground">{project.identifier}</p>
        <h1 className="mt-1 text-3xl font-semibold">{project.emoji ?? "📁"} {project.name}</h1>
        {project.description && <p className="mt-2 text-muted-foreground">{project.description}</p>}
      </header>
    </>
  );
}

type TaskFormProps = {
  name: string;
  statusId: string;
  statuses: Status[];
  loading: boolean;
  onNameChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
};

function TaskForm({ name, statusId, statuses, loading, onNameChange, onStatusChange, onSubmit }: TaskFormProps) {
  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3 rounded-xl border bg-card p-5 md:flex-row">
      <input value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="New task" className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2" required />
      <select value={statusId} onChange={(e) => onStatusChange(e.target.value)} className="rounded-md border bg-background px-3 py-2" required>
        {statuses.map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}
      </select>
      <button disabled={loading || !statusId} className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">{loading ? "Adding..." : "Add task"}</button>
    </form>
  );
}

function StatusColumn({ status, tasks, statuses, onMove }: { status: Status; tasks: Task[]; statuses: Status[]; onMove: (task: Task, statusId: string) => void }) {
  const statusTasks = tasks.filter((task) => task.statusId === status.id);
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between"><h2 className="font-medium">{status.name}</h2><span className="text-xs text-muted-foreground">{statusTasks.length}</span></div>
      <div className="mt-3 space-y-2">
        {statusTasks.map((task) => <TaskCard key={task.id} task={task} statuses={statuses} onMove={onMove} />)}
        {!statusTasks.length && <p className="py-3 text-sm text-muted-foreground">No tasks</p>}
      </div>
    </div>
  );
}

function TaskCard({ task, statuses, onMove }: { task: Task; statuses: Status[]; onMove: (task: Task, statusId: string) => void }) {
  return (
    <article className="rounded-lg border bg-background p-3">
      <p className="font-medium">{task.name}</p>
      <p className="mt-1 text-xs text-muted-foreground">{task.priority}</p>
      <select value={task.statusId} onChange={(e) => void onMove(task, e.target.value)} className="mt-3 rounded-md border bg-background px-2 py-1 text-xs">
        {statuses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
    </article>
  );
}
