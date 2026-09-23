import { Link } from "@tanstack/react-router";
import type { Project, ProjectStatus, ProjectTask } from "@/lib/api";

export function ProjectListPage({
  organizationName,
  state,
}: {
  organizationName: string;
  state: ReturnType<typeof import("./hooks").useProjects>;
}) {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-sm text-muted-foreground">{organizationName}</p>
          <h1 className="mt-1 text-3xl font-semibold">Projects</h1>
          <p className="mt-2 text-muted-foreground">Plan work, manage tasks and track delivery.</p>
        </div>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">Back to home</Link>
      </div>
      <ProjectForm {...state} />
      {state.error && <ErrorMessage message={state.error} />}
      <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {state.projects.map((project) => <ProjectCard key={project.id} project={project} />)}
        {!state.projects.length && <p className="text-sm text-muted-foreground">No projects yet. Create the first one above.</p>}
      </section>
    </main>
  );
}

function ProjectForm({
  name, identifier, description, loading, setName, setIdentifier, setDescription, createProject,
}: Pick<ReturnType<typeof import("./hooks").useProjects>, "name" | "identifier" | "description" | "loading" | "setName" | "setIdentifier" | "setDescription" | "createProject">) {
  return (
    <form onSubmit={createProject} className="mt-8 grid gap-3 rounded-xl border bg-card p-5 md:grid-cols-[1fr_180px]">
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Project name" className="rounded-md border bg-background px-3 py-2" required />
      <input value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="Identifier e.g. APP" className="rounded-md border bg-background px-3 py-2" required />
      <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description (optional)" className="rounded-md border bg-background px-3 py-2 md:col-span-2" />
      <button disabled={loading} className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50 md:col-span-2">{loading ? "Creating..." : "Create project"}</button>
    </form>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link to="/projects/$projectId" params={{ projectId: project.id }} className="rounded-xl border bg-card p-5 transition hover:border-foreground/30">
      <div className="flex items-center gap-2"><span>{project.emoji ?? "📁"}</span><h2 className="font-medium">{project.name}</h2></div>
      <p className="mt-2 text-xs font-medium text-muted-foreground">{project.identifier}</p>
      {project.description && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{project.description}</p>}
    </Link>
  );
}

export function ProjectDetailPage({
  project,
  state,
}: {
  project: Project;
  state: Omit<ReturnType<typeof import("./hooks").useProjectPage>, "project">;
}) {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link to="/projects" className="text-sm text-muted-foreground hover:text-foreground">← Projects</Link>
      <header className="mt-6">
        <p className="text-sm text-muted-foreground">{project.identifier}</p>
        <h1 className="mt-1 text-3xl font-semibold">{project.emoji ?? "📁"} {project.name}</h1>
        {project.description && <p className="mt-2 text-muted-foreground">{project.description}</p>}
      </header>
      <TaskForm {...state} />
      {state.error && <ErrorMessage message={state.error} />}
      <section className="mt-8 space-y-6">
        {state.statuses.map((status) => <StatusColumn key={status.id} status={status} tasks={state.tasks} statuses={state.statuses} onMove={state.moveTask} />)}
      </section>
    </main>
  );
}

function TaskForm({
  name, statusId, statuses, loading, setName, setStatusId, createTask,
}: Pick<Omit<ReturnType<typeof import("./hooks").useProjectPage>, "project">, "name" | "statusId" | "statuses" | "loading" | "setName" | "setStatusId" | "createTask">) {
  return (
    <form onSubmit={createTask} className="mt-8 flex flex-col gap-3 rounded-xl border bg-card p-5 md:flex-row">
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder="New task" className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2" required />
      <select value={statusId} onChange={(event) => setStatusId(event.target.value)} className="rounded-md border bg-background px-3 py-2" required>
        {statuses.map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}
      </select>
      <button disabled={loading || !statusId} className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">{loading ? "Adding..." : "Add task"}</button>
    </form>
  );
}

function StatusColumn({ status, tasks, statuses, onMove }: { status: ProjectStatus; tasks: ProjectTask[]; statuses: ProjectStatus[]; onMove: (task: ProjectTask, statusId: string) => void }) {
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

function TaskCard({ task, statuses, onMove }: { task: ProjectTask; statuses: ProjectStatus[]; onMove: (task: ProjectTask, statusId: string) => void }) {
  return (
    <article className="rounded-lg border bg-background p-3">
      <p className="font-medium">{task.name}</p>
      <p className="mt-1 text-xs text-muted-foreground">{task.priority}</p>
      <select value={task.statusId} onChange={(event) => void onMove(task, event.target.value)} className="mt-3 rounded-md border bg-background px-2 py-1 text-xs">
        {statuses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
    </article>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{message}</p>;
}
