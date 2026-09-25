import { Link } from "@tanstack/react-router";
import type { Project, ProjectTask } from "@/lib/api";
import { StatusColumn } from "./board";
import { ErrorMessage } from "./feedback";
import { TaskDetailPanel } from "./task-detail-panel";

type ProjectPageState = Omit<ReturnType<typeof import("./hooks").useProjectPage>, "project">;

type ProjectDetailPageProps = {
  project: Project;
  state: ProjectPageState;
  organizationId: string;
  selectedTaskId: string | null;
  onSelectTask: (task: ProjectTask) => void;
  onCloseTask: () => void;
};

export function ProjectDetailPage({
  project,
  state,
  organizationId,
  selectedTaskId,
  onSelectTask,
  onCloseTask,
}: ProjectDetailPageProps) {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link to="/projects" className="text-sm text-muted-foreground hover:text-foreground">
        ← Projects
      </Link>
      <header className="mt-6">
        <p className="text-sm text-muted-foreground">{project.identifier}</p>
        <h1 className="mt-1 text-3xl font-semibold">
          {project.emoji ?? "📁"} {project.name}
        </h1>
        {project.description && <p className="mt-2 text-muted-foreground">{project.description}</p>}
      </header>
      <TaskForm {...state} />
      {state.error && <ErrorMessage message={state.error} />}
      <section className="mt-8 space-y-6">
        {state.statuses.map((status) => (
          <StatusColumn
            key={status.id}
            status={status}
            tasks={state.tasks}
            statuses={state.statuses}
            onMove={state.moveTask}
            onSelect={onSelectTask}
          />
        ))}
      </section>
      <TaskDetailPanel
        organizationId={organizationId}
        projectId={project.id}
        taskId={selectedTaskId}
        statuses={state.statuses}
        onClose={onCloseTask}
      />
    </main>
  );
}

function TaskForm({
  name,
  statusId,
  statuses,
  loading,
  setName,
  setStatusId,
  createTask,
}: Pick<
  ProjectPageState,
  "name" | "statusId" | "statuses" | "loading" | "setName" | "setStatusId" | "createTask"
>) {
  return (
    <form
      onSubmit={createTask}
      className="mt-8 flex flex-col gap-3 rounded-xl border bg-card p-5 md:flex-row"
    >
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="New task"
        className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2"
        required
      />
      <select
        value={statusId}
        onChange={(event) => setStatusId(event.target.value)}
        className="rounded-md border bg-background px-3 py-2"
        required
      >
        {statuses.map((status) => (
          <option key={status.id} value={status.id}>
            {status.name}
          </option>
        ))}
      </select>
      <button
        disabled={loading || !statusId}
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
      >
        {loading ? "Adding..." : "Add task"}
      </button>
    </form>
  );
}
