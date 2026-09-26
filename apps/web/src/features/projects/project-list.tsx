import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { IconFilter, IconLayoutGrid, IconList, IconPlus, IconArrowLeft, IconSettings, IconSearch } from "@tabler/icons-react";
import type { Project } from "@/lib/api";
import { ProjectCard } from "./project-card";
import { ErrorMessage, MutedMessage } from "./feedback";

type ProjectsState = ReturnType<typeof import("./use-projects").useProjects>;

const STATUS_OPTIONS = [
  { label: "All projects", value: "all" },
  { label: "Planned", value: "planned" },
  { label: "Backlog", value: "backlog" },
  { label: "In Progress", value: "in_progress" },
  { label: "Paused", value: "paused" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

// fallow-ignore-next-line complexity -- project list coordinates filters, creation and responsive presentation in one page
// fallow-ignore-next-line complexity -- project list coordinates filters, creation and responsive presentation in one page
export function ProjectListPage({
  organizationSlug,
  state,
}: {
  organizationName: string;
  organizationSlug: string;
  state: ProjectsState;
}) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateProject, setShowCreateProject] = useState(false);

  const filteredProjects = useMemo(
    () => state.projects.filter((project: Project) => (statusFilter === "all" || project.status === statusFilter) && (!searchQuery.trim() || `${project.name} ${project.identifier} ${project.description ?? ""}`.toLowerCase().includes(searchQuery.trim().toLowerCase()))),
    [state.projects, statusFilter, searchQuery],
  );

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b bg-background/95 px-5 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center rounded-lg bg-secondary p-1">
            <button type="button" onClick={() => setViewMode("board")} className={`inline-flex h-8 items-center gap-2 rounded-md px-3 text-xs font-medium ${viewMode === "board" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              <IconLayoutGrid className="size-3.5" /> Board
            </button>
            <button type="button" onClick={() => setViewMode("list")} className={`inline-flex h-8 items-center gap-2 rounded-md px-3 text-xs font-medium ${viewMode === "list" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              <IconList className="size-3.5" /> List
            </button>
          </div>
          <div className="relative w-48"><IconSearch className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search projects..." className="h-9 w-full rounded-lg border bg-background pl-8 pr-3 text-xs outline-none focus:border-primary" /></div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-9 w-40 rounded-md border bg-background px-3 text-xs">
            <option value="all"><IconFilter /> All projects</option>
            {STATUS_OPTIONS.slice(1).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/$organizationSlug" params={{ organizationSlug }} className="hidden items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium hover:bg-muted sm:inline-flex">
            <IconArrowLeft className="size-3.5" /> Home
          </Link>
          <Link to="/$organizationSlug/settings" params={{ organizationSlug }} className="hidden items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium hover:bg-muted sm:inline-flex">
            <IconSettings className="size-3.5" /> Settings
          </Link>
          <button type="button" onClick={() => setShowCreateProject((value) => !value)} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
            <IconPlus className="size-4" /> {showCreateProject ? "Close" : "Add Project"}
          </button>
        </div>
      </div>

      {state.error && <div className="px-4 pt-4"><ErrorMessage message={state.error} /></div>}

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {state.projectsLoading ? (
          <div className="flex h-40 items-center justify-center"><MutedMessage message="Fetching projects..." /></div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex min-h-[420px] items-center justify-center text-center">
            <div>
              <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-border/50 bg-primary/10">
                <IconLayoutGrid className="size-8 text-primary/70" />
              </div>
              <h3 className="mb-5 text-lg font-bold">{state.projects.length === 0 ? "Create your first project" : "No projects found"}</h3>
              <button type="button" onClick={() => setShowCreateProject(true)} className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
                <IconPlus className="mr-2 inline size-4" /> Create project
              </button>
            </div>
          </div>
        ) : viewMode === "board" ? (
          <div className="grid grid-cols-1 gap-4 pb-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => <ProjectCard key={project.id} project={project} organizationSlug={organizationSlug} />)}
          </div>
        ) : (
          <div className="divide-y rounded-xl border bg-background">
            {filteredProjects.map((project) => (
              <Link key={project.id} to="/$organizationSlug/projects/$projectId" params={{ organizationSlug, projectId: project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") }} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">{project.name.charAt(0)}</span>
                <span className="min-w-0 flex-1"><strong className="block truncate text-sm">{project.name}</strong><span className="text-xs text-muted-foreground">{project.description || "No description"}</span></span>
                <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-semibold">{project.identifier}</span>
              </Link>
            ))}
          </div>
        )}

        {showCreateProject && <section id="create-project" className="mt-5 rounded-xl border bg-background p-4">
          <h2 className="text-sm font-bold">Create Project</h2>
          <p className="mt-1 text-xs text-muted-foreground">Create a project to start managing tasks and milestones.</p>
          <form onSubmit={state.createProject} className="mt-4 grid gap-2 md:grid-cols-[minmax(0,1fr)_150px_minmax(0,1fr)_auto]">
            <input value={state.name} onChange={(event) => state.setName(event.target.value)} placeholder="Project name" className="h-10 rounded-lg border bg-card px-3 text-sm" required />
            <input value={state.identifier} onChange={(event) => state.setIdentifier(event.target.value)} placeholder="Code" className="h-10 rounded-lg border bg-card px-3 text-sm" required />
            <input value={state.description} onChange={(event) => state.setDescription(event.target.value)} placeholder="Description" className="h-10 rounded-lg border bg-card px-3 text-sm" />
            <button disabled={state.loading} className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">{state.loading ? "Creating..." : "Create"}</button>
          </form>
        </section>}\n      </div>
    </div>
  );
}
