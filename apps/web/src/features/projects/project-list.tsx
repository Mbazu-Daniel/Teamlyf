import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  IconCheck,
  IconFilter,
  IconLayoutGrid,
  IconList,
  IconPlus,
  IconSearch,
} from "@tabler/icons-react";
import type { Project } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ProjectCard } from "./project-card";
import { ErrorMessage, MutedMessage } from "./feedback";

type ProjectsState = ReturnType<typeof import("./use-projects").useProjects>;

const STATUS_OPTIONS = [
  { label: "All statuses", value: "all" },
  { label: "Planned", value: "planned" },
  { label: "Backlog", value: "backlog" },
  { label: "In Progress", value: "in_progress" },
  { label: "Paused", value: "paused" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const SORT_OPTIONS = [
  { label: "Name A–Z", value: "name-asc" },
  { label: "Name Z–A", value: "name-desc" },
  { label: "Newest", value: "created-desc" },
  { label: "Recently updated", value: "updated-desc" },
];

export function ProjectListPage({
  organizationSlug,
  state,
}: {
  organizationName: string;
  organizationSlug: string;
  state: ProjectsState;
}) {
  const navigate = useNavigate({ from: "/$organizationSlug/projects" });
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [sortValue, setSortValue] = useState("name-asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showCreateProject, setShowCreateProject] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!state.createdProject) return;
    setShowCreateProject(false);
    void navigate({
      to: "/$organizationSlug/projects/$projectId",
      params: { organizationSlug, projectId: state.createdProject.identifier },
    });
  }, [navigate, organizationSlug, state.createdProject]);

  const projects = useMemo(() => {
    const query = debouncedSearch.toLowerCase();
    const filtered = state.projects.filter((project: Project) => {
      const matchesStatus = statusFilter === "all" || project.status === statusFilter;
      const matchesSearch =
        !query ||
        `${project.name} ${project.identifier} ${project.description ?? ""}`.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      switch (sortValue) {
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "created-desc":
        case "updated-desc":
          return b.identifier.localeCompare(a.identifier);
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [debouncedSearch, sortValue, state.projects, statusFilter]);

  const isFilterActive = statusFilter !== "all" || debouncedSearch.length > 0;

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-[var(--app-page-background)]">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 p-3 pb-6 md:p-4">
          <section className="rounded-xl border border-border bg-card/95 p-3 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex shrink-0 items-center rounded-lg bg-secondary p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("board")}
                    className={cn(
                      "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-all",
                      viewMode === "board"
                        ? "bg-background text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <IconLayoutGrid className="size-3.5" />
                    Board
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-all",
                      viewMode === "list"
                        ? "bg-background text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <IconList className="size-3.5" />
                    List
                  </button>
                </div>

                <div className="relative w-full max-w-md">
                  <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search projects…"
                    className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
                  <IconFilter className="ml-1 size-3.5 text-muted-foreground" />
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="h-7 w-[130px] border-0 bg-transparent px-1 text-xs outline-none"
                    aria-label="Filter projects by status"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="h-5 w-px bg-border" />
                  <select
                    value={sortValue}
                    onChange={(event) => setSortValue(event.target.value)}
                    className="h-7 w-[125px] border-0 bg-transparent px-1 text-xs outline-none"
                    aria-label="Sort projects"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreateProject((value) => !value)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  <IconPlus className="size-3.5" />
                  {showCreateProject ? "Close" : "New project"}
                </button>
              </div>
            </div>
          </section>

          {state.error && <ErrorMessage message={state.error} />}

          <section className="rounded-xl border border-border bg-card/95 p-3 shadow-sm md:p-4">
            {state.projectsLoading ? (
              <div className="flex min-h-[420px] items-center justify-center">
                <MutedMessage message="Fetching projects…" />
              </div>
            ) : projects.length === 0 ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
                <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10">
                  <IconLayoutGrid className="size-7 text-primary" />
                </div>
                <h2 className="text-xl font-semibold tracking-tight">
                  {isFilterActive ? "No projects found" : "No projects yet"}
                </h2>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  {isFilterActive ? "Try clearing search or status filters." : "Create your first project."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (isFilterActive) {
                      setSearchQuery("");
                      setStatusFilter("all");
                    } else {
                      setShowCreateProject(true);
                    }
                  }}
                  className="mt-6 inline-flex h-9 items-center gap-1.5 rounded-md border px-4 text-xs font-semibold hover:bg-muted"
                >
                  <IconCheck className="size-4" />
                  {isFilterActive ? "Clear filters" : "Create project"}
                </button>
              </div>
            ) : viewMode === "board" ? (
              <div className="grid grid-cols-1 gap-4 pb-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} organizationSlug={organizationSlug} />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[720px] divide-y rounded-xl border bg-background">
                  <div className="grid grid-cols-[minmax(0,1.6fr)_140px_minmax(0,1fr)] gap-3 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <span>Name</span>
                    <span>Status</span>
                    <span>Members</span>
                  </div>
                  {projects.map((project) => (
                    <Link
                      key={project.id}
                      to="/$organizationSlug/projects/$projectId"
                      params={{ organizationSlug, projectId: project.identifier }}
                      className="grid grid-cols-[minmax(0,1.6fr)_140px_minmax(0,1fr)] items-center gap-3 px-4 py-3 hover:bg-muted/50"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                          {project.name.charAt(0)}
                        </span>
                        <span className="min-w-0">
                          <strong className="block truncate text-sm">{project.name}</strong>
                          <span className="text-xs text-muted-foreground">{project.identifier}</span>
                        </span>
                      </span>
                      <span className="text-xs font-medium capitalize">{project.status?.replace("_", " ") ?? "—"}</span>
                      <span className="text-xs text-muted-foreground">{project.members?.length ?? 0} members</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>

          {showCreateProject && (
            <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <h2 className="text-sm font-bold">Create project</h2>
              <p className="mt-1 text-xs text-muted-foreground">Create a project to start managing tasks and milestones.</p>
              <form onSubmit={state.createProject} className="mt-4 grid gap-2 md:grid-cols-[minmax(0,1fr)_150px_minmax(0,1fr)_auto]">
                <input value={state.name} onChange={(event) => state.setName(event.target.value)} placeholder="Project name" className="h-10 rounded-lg border bg-background px-3 text-sm" required />
                <input value={state.identifier} onChange={(event) => state.setIdentifier(event.target.value)} placeholder="Code" className="h-10 rounded-lg border bg-background px-3 text-sm" required />
                <input value={state.description} onChange={(event) => state.setDescription(event.target.value)} placeholder="Description" className="h-10 rounded-lg border bg-background px-3 text-sm" />
                <button disabled={state.loading} className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                  {state.loading ? "Creating…" : "Create"}
                </button>
              </form>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
