import { Link } from "@tanstack/react-router";
import type { Project } from "@/lib/api";
import { ErrorMessage, MutedMessage } from "./feedback";

type ProjectsState = ReturnType<typeof import("./hooks").useProjects>;

export function ProjectListPage({
  organizationName,
  state,
}: {
  organizationName: string;
  state: ProjectsState;
}) {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <ProjectHeader organizationName={organizationName} />
      <ProjectForm {...state} />
      {state.error && <ErrorMessage message={state.error} />}
      <ProjectListContent state={state} />
    </main>
  );
}

function ProjectHeader({ organizationName }: { organizationName: string }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div>
        <p className="text-sm text-muted-foreground">{organizationName}</p>
        <h1 className="mt-1 text-3xl font-semibold">Projects</h1>
        <p className="mt-2 text-muted-foreground">Plan work, manage tasks and track delivery.</p>
      </div>
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
        Back to home
      </Link>
    </div>
  );
}

function ProjectForm({
  name,
  identifier,
  description,
  loading,
  setName,
  setIdentifier,
  setDescription,
  createProject,
}: Pick<
  ProjectsState,
  | "name"
  | "identifier"
  | "description"
  | "loading"
  | "setName"
  | "setIdentifier"
  | "setDescription"
  | "createProject"
>) {
  return (
    <form
      onSubmit={createProject}
      className="mt-8 grid gap-3 rounded-xl border bg-card p-5 md:grid-cols-[1fr_180px]"
    >
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Project name"
        className="rounded-md border bg-background px-3 py-2"
        required
      />
      <input
        value={identifier}
        onChange={(event) => setIdentifier(event.target.value)}
        placeholder="Identifier e.g. APP"
        className="rounded-md border bg-background px-3 py-2"
        required
      />
      <input
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Description (optional)"
        className="rounded-md border bg-background px-3 py-2 md:col-span-2"
      />
      <button
        disabled={loading}
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50 md:col-span-2"
      >
        {loading ? "Creating..." : "Create project"}
      </button>
    </form>
  );
}

function ProjectListContent({ state }: { state: ProjectsState }) {
  return (
    <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <ProjectListState state={state} />
    </section>
  );
}

function ProjectListState({ state }: { state: ProjectsState }) {
  if (state.projectsLoading) return <MutedMessage message="Loading projects..." />;
  if (!state.projects.length)
    return <MutedMessage message="No projects yet. Create the first one above." />;
  return <ProjectCards projects={state.projects} />;
}

function ProjectCards({ projects }: { projects: Project[] }) {
  return (
    <>
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      to="/projects/$projectId"
      params={{ projectId: project.id }}
      className="rounded-xl border bg-card p-5 transition hover:border-foreground/30"
    >
      <div className="flex items-center gap-2">
        <span>{project.emoji ?? "📁"}</span>
        <h2 className="font-medium">{project.name}</h2>
      </div>
      <p className="mt-2 text-xs font-medium text-muted-foreground">{project.identifier}</p>
      {project.description && (
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
      )}
    </Link>
  );
}
