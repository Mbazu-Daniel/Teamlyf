// fallow-ignore-file complexity
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  IconArrowsSort,
  IconCheck,
  IconFilter,
  IconFolder,
  IconLayoutGrid,
  IconList,
  IconPlus,
  IconSearch,
} from "@tabler/icons-react";
import type { Project } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProjectCard } from "./project-card";
import { ErrorMessage, MutedMessage } from "./feedback";
import { PROJECT_CODE_MAX, PROJECT_CODE_MIN } from "./use-projects";
import { projectSlug } from "@/lib/slug";

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
  { label: "Name A-Z", value: "name-asc" },
  { label: "Name Z-A", value: "name-desc" },
  { label: "Newest", value: "created-desc" },
  { label: "Recently updated", value: "updated-desc" },
  { label: "Most tasks", value: "tasks-desc" },
  { label: "Highest progress", value: "progress-desc" },
  { label: "Latest task due date", value: "target-asc" },
];

const STATUS_STYLES: Record<string, string> = {
  planned:
    "bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-400/20",
  backlog:
    "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-400/20",
  in_progress:
    "bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/20",
  paused:
    "bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/20",
  completed:
    "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/20",
  cancelled:
    "bg-rose-100 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/20",
};

const STATUS_DOT_STYLES: Record<string, string> = {
  planned: "bg-violet-500",
  backlog: "bg-slate-400",
  in_progress: "bg-blue-500",
  paused: "bg-amber-500",
  completed: "bg-emerald-500",
  cancelled: "bg-rose-500",
};

function ProjectStatusPill({ status }: { status?: string | null }) {
  const key = status ?? "planned";
  const label = key.replace("_", " ");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ring-1",
        STATUS_STYLES[key] ?? STATUS_STYLES.planned,
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", STATUS_DOT_STYLES[key] ?? STATUS_DOT_STYLES.planned)}
      />
      {label}
    </span>
  );
}

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
      params: { organizationSlug, projectId: projectSlug(state.createdProject) },
    });
  }, [navigate, organizationSlug, state.createdProject]);

  const projects = useMemo(() => {
    const query = debouncedSearch.toLowerCase();
    const filtered = state.projects.filter((project: Project) => {
      const matchesStatus = statusFilter === "all" || project.status === statusFilter;
      const matchesSearch =
        !query ||
        `${project.name} ${project.identifier} ${project.description ?? ""}`
          .toLowerCase()
          .includes(query);
      return matchesStatus && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      switch (sortValue) {
        case "tasks-desc":
          return (b.taskCount ?? 0) - (a.taskCount ?? 0);
        case "progress-desc":
          return (
            (b.completedCount ?? 0) / Math.max(1, b.taskCount ?? 0) -
            (a.completedCount ?? 0) / Math.max(1, a.taskCount ?? 0)
          );
        case "target-asc":
          return (
            (a.targetDate ? Date.parse(a.targetDate) : Number.MAX_SAFE_INTEGER) -
            (b.targetDate ? Date.parse(b.targetDate) : Number.MAX_SAFE_INTEGER)
          );
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "created-desc":
          return (Date.parse(b.createdAt ?? "") || 0) - (Date.parse(a.createdAt ?? "") || 0);
        case "updated-desc":
          return (
            (Date.parse(b.updatedAt ?? b.createdAt ?? "") || 0) -
            (Date.parse(a.updatedAt ?? a.createdAt ?? "") || 0)
          );
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [debouncedSearch, sortValue, state.projects, statusFilter]);

  const isFilterActive = statusFilter !== "all" || debouncedSearch.length > 0;

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 py-5 pb-8 sm:px-6 lg:px-8">
          <section className="app-card rounded-[16px] border-border/70 p-4 shadow-[0_8px_20px_-20px_rgba(15,23,42,0.2)] sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex h-control shrink-0 items-center rounded-[10px] bg-muted/75 p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("board")}
                    aria-pressed={viewMode === "board"}
                    className={cn(
                      "inline-flex h-control-inner items-center gap-2 rounded-[8px] px-3.5 text-sm font-semibold transition-all cursor-pointer",
                      viewMode === "board"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <IconLayoutGrid className="size-4" />
                    Board
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    aria-pressed={viewMode === "list"}
                    className={cn(
                      "inline-flex h-control-inner items-center gap-2 rounded-[8px] px-3.5 text-sm font-semibold transition-all cursor-pointer",
                      viewMode === "list"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <IconList className="size-4" />
                    List
                  </button>
                </div>

                <div className="relative w-full max-w-xl">
                  <IconSearch className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search projects..."
                    aria-label="Search projects"
                    className="h-control w-full rounded-[10px] border border-border/80 bg-muted/45 pl-11 pr-4 text-sm font-normal outline-none transition placeholder:text-muted-foreground/80 focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Select
                  value={statusFilter}
                  items={Object.fromEntries(
                    STATUS_OPTIONS.map((option) => [option.value, option.label]),
                  )}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger variant="filter" className="min-w-[180px]">
                    <span className="flex items-center gap-2">
                      <IconFilter className="size-4 text-muted-foreground" />
                      <SelectValue placeholder="Filter status" />
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              "size-2 rounded-full",
                              option.value === "all"
                                ? "bg-muted-foreground"
                                : STATUS_DOT_STYLES[option.value],
                            )}
                          />
                          {option.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={sortValue}
                  items={Object.fromEntries(
                    SORT_OPTIONS.map((option) => [option.value, option.label]),
                  )}
                  onValueChange={setSortValue}
                >
                  <SelectTrigger variant="filter" className="min-w-[180px]">
                    <span className="flex items-center gap-2">
                      <IconArrowsSort className="size-4 text-muted-foreground" />
                      <SelectValue placeholder="Sort projects" />
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <button
                  type="button"
                  onClick={() => setShowCreateProject(true)}
                  className="inline-flex h-control shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[12px] bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 cursor-pointer"
                >
                  <IconPlus className="size-3.5" />
                  New project
                </button>
              </div>
            </div>
          </section>

          {state.error && <ErrorMessage message={state.error} />}

          <section>
            {state.projectsLoading ? (
              <div className="app-card flex min-h-105 items-center justify-center rounded-[16px] border-border/70 shadow-[0_8px_20px_-20px_rgba(15,23,42,0.2)]">
                <MutedMessage message="Fetching projects..." />
              </div>
            ) : projects.length === 0 ? (
              <div className="app-card flex min-h-105 flex-col items-center justify-center rounded-[16px] border-dashed border-border/80 bg-card/70 px-6 py-12 text-center shadow-none">
                <div className="mb-5 flex size-14 items-center justify-center rounded-[16px] bg-primary/10">
                  <IconFolder className="size-6 text-primary" />
                </div>
                <h2 className="text-xl font-semibold tracking-tight">
                  {isFilterActive ? "No projects found" : "No projects yet"}
                </h2>
                {/* <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  {isFilterActive
                    ? "Try clearing search or status filters."
                    : "Create your first project."}
                </p> */}
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
                  className="mt-6 inline-flex h-control items-center gap-1.5 rounded-[9px] border border-border bg-background px-4 text-xs font-semibold transition hover:bg-muted cursor-pointer"
                >
                  <IconCheck className="size-4" />  
                  {isFilterActive ? "Clear filters" : "Create project"}
                </button>
              </div>
            ) : (
              <div>
                {viewMode === "board" ? (
                  <div
                    aria-label="Project cards"
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
                  >
                    {projects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        organizationSlug={organizationSlug}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="min-w-[760px] divide-y overflow-hidden rounded-[12px] border border-border/70 bg-card">
                      <div className="grid grid-cols-[minmax(0,1.7fr)_170px_minmax(0,0.85fr)] gap-3 bg-muted/35 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        <span>Name</span>
                        <span>Status</span>
                        <span>Members</span>
                      </div>
                      {projects.map((project) => (
                        <Link
                          key={project.id}
                          to="/$organizationSlug/projects/$projectId"
                          params={{ organizationSlug, projectId: projectSlug(project) }}
                          className="grid grid-cols-[minmax(0,1.7fr)_170px_minmax(0,0.85fr)] items-center gap-3 px-5 py-4 transition hover:bg-muted/45"
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-sm font-semibold text-primary">
                              {project.name.charAt(0)}
                            </span>
                            <span className="min-w-0">
                              <strong className="block truncate text-sm">{project.name}</strong>
                              <span className="text-xs text-muted-foreground">
                                {project.identifier}
                              </span>
                            </span>
                          </span>
                          <ProjectStatusPill status={project.status} />
                          <span className="text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">
                              {project.members?.length ?? 0}
                            </span>{" "}
                            {project.members?.length === 1 ? "member" : "members"}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      <Sheet open={showCreateProject} onOpenChange={setShowCreateProject}>
        <SheetContent side="right" variant="form" className="w-full sm:max-w-[28rem]">
          <SheetHeader variant="form">
            <SheetTitle variant="form" className="mt-1">
              Create project
            </SheetTitle>
          </SheetHeader>

          <form onSubmit={state.createProject} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-6">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-foreground">Project name</span>
                <input
                  value={state.name}
                  onChange={(event) => state.setName(event.target.value)}
                  placeholder="e.g. Product launch"
                  className="h-control w-full rounded-[10px] border border-border/80 bg-background px-3 text-sm font-normal outline-none transition placeholder:text-muted-foreground/80 focus:border-primary focus:ring-2 focus:ring-primary/10"
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-foreground">Project code</span>
                <input
                  value={state.identifier}
                  onChange={(event) => state.setIdentifier(event.target.value)}
                  placeholder="e.g. LAUNCH"
                  minLength={PROJECT_CODE_MIN}
                  maxLength={PROJECT_CODE_MAX}
                  className="h-control w-full rounded-[10px] border border-border/80 bg-background px-3 text-sm font-normal outline-none transition placeholder:text-muted-foreground/80 focus:border-primary focus:ring-2 focus:ring-primary/10 capitalize"
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-foreground">
                  Description <span className="font-normal text-muted-foreground">(optional)</span>
                </span>
                <textarea
                  value={state.description}
                  onChange={(event) => state.setDescription(event.target.value)}
                  placeholder="What is this project for?"
                  className="min-h-28 w-full resize-y rounded-[10px] border border-border/80 bg-background px-3 py-2.5 text-sm font-normal outline-none transition placeholder:text-muted-foreground/80 focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border/70 px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={() => setShowCreateProject(false)}
                className="h-control rounded-[10px] px-4 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                Cancel
              </button>
              <button
                disabled={state.loading}
                className="inline-flex h-control items-center gap-2 rounded-[10px] bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[0_5px_12px_-11px_hsl(var(--primary))] transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                <IconPlus className="size-4" />
                {state.loading ? "Creating..." : "Create project"}
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
