import { Link } from "@tanstack/react-router";
import { IconArrowLeft, IconPlus, IconSettings } from "@tabler/icons-react";
import { ProjectCard } from "./project-card";
import { ErrorMessage, MutedMessage } from "./feedback";

type ProjectsState = ReturnType<typeof import("./hooks").useProjects>;

export function ProjectListPage({
  organizationName,
  organizationSlug,
  state,
}: {
  organizationName: string;
  organizationSlug?: string;
  state: ProjectsState;
}) {
  const slug = organizationSlug ?? "";

  return (
    <main className="min-h-full bg-background px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-5 flex items-end justify-between gap-4 border-b pb-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{organizationName}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Projects</h1>
            <p className="mt-1 text-xs text-muted-foreground">Choose a project to open its task workspace.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to={slug ? "/$organizationSlug" : "/"} params={slug ? { organizationSlug: slug } : undefined} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-muted">
              <IconArrowLeft className="size-3.5" /> Home
            </Link>
            <Link to="/$organizationSlug/settings" params={{ organizationSlug: slug }} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-muted">
              <IconSettings className="size-3.5" /> Settings
            </Link>
          </div>
        </header>

        {state.error && <ErrorMessage message={state.error} />}

        <section className="rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">All projects</h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{state.projects.length} {state.projects.length === 1 ? "project" : "projects"}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground"><IconPlus className="size-3" /> Create below</span>
          </div>

          <div className="p-4 sm:p-5">
            {state.projectsLoading ? (
              <MutedMessage message="Loading projects..." />
            ) : state.projects.length === 0 ? (
              <MutedMessage message="No projects yet. Create your first project below." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {state.projects.map((project) => (
                  <ProjectCard key={project.id} project={project} organizationSlug={slug} />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mt-4 rounded-xl border bg-card p-4 sm:p-5">
          <div className="mb-3">
            <h2 className="text-sm font-semibold">Create a project</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Projects become the home for tasks, milestones and project workflow.</p>
          </div>
          <ProjectForm {...state} />
        </section>
      </div>
    </main>
  );
}

function ProjectForm({
  name, identifier, description, loading, setName, setIdentifier, setDescription, createProject,
}: Pick<ProjectsState, "name" | "identifier" | "description" | "loading" | "setName" | "setIdentifier" | "setDescription" | "createProject">) {
  return (
    <form onSubmit={createProject} className="grid gap-2 md:grid-cols-[minmax(0,1fr)_150px_minmax(0,1fr)_auto]">
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Project name" className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary" required />
      <input value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="Identifier" className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary" required />
      <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
      <button disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{loading ? "Creating..." : "Create project"}</button>
    </form>
  );
}
