import { Link } from "@tanstack/react-router";
import { IconArrowUpRight, IconCheck, IconFolder, IconSparkles } from "@tabler/icons-react";
import type { Project } from "@/lib/api";
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
  const featuredProject = state.projects[0];

  return (
    <main className="min-h-full bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.13em] text-muted-foreground">
              {organizationName}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Overview</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={organizationSlug ? "/$organizationSlug" : "/"}
              params={organizationSlug ? { organizationSlug } : undefined}
              className="rounded-full border px-3.5 py-2 text-xs font-semibold transition hover:bg-muted"
            >
              Home
            </Link>
            <Link
              to="/$organizationSlug/settings"
              params={{ organizationSlug: organizationSlug ?? "" }}
              className="rounded-full border px-3.5 py-2 text-xs font-semibold transition hover:bg-muted"
            >
              Settings
            </Link>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
          <section className="overflow-hidden rounded-2xl border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-4 sm:px-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
                  Project
                </p>
                <h2 className="mt-1 text-lg font-semibold">
                  {featuredProject?.name ?? "Your projects"}
                </h2>
              </div>
              <span className="rounded-full border px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground">
                {state.projects.length} {state.projects.length === 1 ? "project" : "projects"}
              </span>
            </div>

            <div className="p-4 sm:p-5">
              {state.error && <ErrorMessage message={state.error} />}
              <ProjectListContent state={state} />
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Workspace activity</span>
                <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
              </div>
              <div className="mt-5 flex h-24 items-end gap-1.5">
                {[32, 48, 40, 62, 51, 78, 68].map((height, index) => (
                  <span
                    key={index}
                    className="flex-1 rounded-t bg-primary/60"
                    style={{ height: \`\${height}%\` }}
                  />
                ))}
              </div>
              <p className="mt-3 text-[10px] text-muted-foreground">
                Recent activity across your organization.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-4">
              <div className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-primary">
                  <IconSparkles className="size-3.5" />
                </span>
                <div>
                  <p className="text-xs font-semibold">AI agent</p>
                  <p className="text-[10px] text-muted-foreground">Workspace assistant</p>
                </div>
              </div>
              <p className="mt-3 text-[10px] leading-4 text-muted-foreground">
                Turn project updates into clear next actions.
              </p>
            </div>
          </aside>
        </div>

        <div className="mt-4 rounded-2xl border bg-card p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <IconFolder className="size-4 text-primary" />
            <span className="text-xs font-semibold">Create a project</span>
          </div>
          <ProjectForm {...state} />
        </div>
      </div>
    </main>
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
    <form onSubmit={createProject} className="grid gap-2 md:grid-cols-[1fr_150px_auto]">
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Project name"
        className="rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary"
        required
      />
      <input
        value={identifier}
        onChange={(event) => setIdentifier(event.target.value)}
        placeholder="Identifier"
        className="rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary"
        required
      />
      <input
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Description"
        className="rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary md:col-span-3"
      />
      <button
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50 md:col-span-3 md:justify-self-start"
      >
        {loading ? "Creating..." : "Create project"}
        {!loading && <IconArrowUpRight className="size-3.5" />}
      </button>
    </form>
  );
}

function ProjectListContent({ state, organizationSlug }: { state: ProjectsState; organizationSlug?: string }) {
  return <div className="grid gap-2">{<ProjectListState state={state} organizationSlug={organizationSlug} />}</div>;
}

function ProjectListState({ state, organizationSlug }: { state: ProjectsState; organizationSlug?: string }) {
  if (state.projectsLoading) return <MutedMessage message="Loading projects..." />;
  if (!state.projects.length)
    return <MutedMessage message="No projects yet. Create the first one below." />;
  return <ProjectCards projects={state.projects} organizationSlug={organizationSlug} />;
}

function ProjectCards({ projects, organizationSlug }: { projects: Project[]; organizationSlug?: string }) {
  return (
    <>
      {projects.map((project) => (
        <Link
          key={project.id}
          to="/$organizationSlug/projects/$projectId"
          params={{ organizationSlug: organizationSlug ?? "", projectId: project.id }}
          className="group flex items-center gap-3 rounded-xl border p-3 transition hover:border-primary/40 hover:bg-muted/40"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            {project.emoji ?? <IconFolder className="size-4" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{project.name}</span>
            <span className="mt-0.5 block text-[10px] font-medium text-muted-foreground">
              {project.identifier}
              {project.description ? \` · \${project.description}\` : ""}
            </span>
          </span>
          <IconArrowUpRight className="size-4 text-muted-foreground transition group-hover:text-foreground" />
        </Link>
      ))}
    </>
  );
}
