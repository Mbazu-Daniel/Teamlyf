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
  const [project, setProject] = useState<Project | null>(null);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [name, setName] = useState("");
  const [statusId, setStatusId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organization) return;
    void load();
  }, [organization?.id, projectId]);

  async function load() {
    if (!organization) return;
    setError(null);
    try {
      const prefix = `/organization/${organization.id}/projects/${projectId}`;
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
    if (!organization || !name.trim() || !statusId) return;
    setLoading(true);
    setError(null);
    try {
      const task = await api<Task>(`/organization/${organization.id}/projects/${projectId}/tasks`, {
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
    if (!organization || task.statusId === nextStatusId) return;
    setError(null);
    try {
      const updated = await api<Task>(`/organization/${organization.id}/projects/${projectId}/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ statusId: nextStatusId }),
      });
      setTasks((current) => current.map((item) => item.id === task.id ? updated : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update task");
    }
  }

  if (!organization) return <main className="mx-auto max-w-6xl px-6 py-12"><h1 className="text-2xl font-semibold">Project</h1><p className="mt-2 text-muted-foreground">Select an organization first.</p></main>;
  if (!project) return <main className="mx-auto max-w-6xl px-6 py-12"><p className="text-sm text-muted-foreground">{error ?? "Loading project..."}</p></main>;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link to="/projects" className="text-sm text-muted-foreground hover:text-foreground">← Projects</Link>
      <header className="mt-6"><p className="text-sm text-muted-foreground">{project.identifier}</p><h1 className="mt-1 text-3xl font-semibold">{project.emoji ?? "📁"} {project.name}</h1>{project.description && <p className="mt-2 text-muted-foreground">{project.description}</p>}</header>

      <form onSubmit={createTask} className="mt-8 flex flex-col gap-3 rounded-xl border bg-card p-5 md:flex-row">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New task" className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2" required />
        <select value={statusId} onChange={(e) => setStatusId(e.target.value)} className="rounded-md border bg-background px-3 py-2" required>
          {statuses.map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}
        </select>
        <button disabled={loading || !statusId} className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">{loading ? "Adding..." : "Add task"}</button>
      </form>

      {error && <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}

      <section className="mt-8 space-y-6">
        {statuses.map((status) => {
          const statusTasks = tasks.filter((task) => task.statusId === status.id);
          return <div key={status.id} className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between"><h2 className="font-medium">{status.name}</h2><span className="text-xs text-muted-foreground">{statusTasks.length}</span></div>
            <div className="mt-3 space-y-2">
              {statusTasks.map((task) => <article key={task.id} className="rounded-lg border bg-background p-3">
                <p className="font-medium">{task.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{task.priority}</p>
                <select value={task.statusId} onChange={(e) => void moveTask(task, e.target.value)} className="mt-3 rounded-md border bg-background px-2 py-1 text-xs">
                  {statuses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </article>)}
              {!statusTasks.length && <p className="py-3 text-sm text-muted-foreground">No tasks</p>}
            </div>
          </div>;
        })}
      </section>
    </main>
  );
}
