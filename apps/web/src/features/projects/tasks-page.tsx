import { useMemo, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { IconLayoutKanban, IconList, IconPlus, IconSearch } from "@tabler/icons-react";
import { useOrganization } from "@/lib/organization";
import { projectsApi, statusesApi, type ProjectTask, type Status } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { TaskList } from "@/features/projects/task-list";
import { KanbanBoard } from "@/features/projects/board";
import { TaskDetailPanel } from "@/features/projects/task-detail-panel";
import { useProjectPage } from "@/features/projects/hooks";

export function TasksPage() {
  const { organization } = useOrganization();
  const organizationId = organization?.id;
  const organizationSlug = organization?.slug ?? organization?.id ?? "";
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [view, setView] = useState<"board" | "list">("board");
  const [search, setSearch] = useState("");
  const [selectedTask, setSelectedTask] = useState<{ projectId: string; taskId: string } | null>(null);

  const projectsQuery = useQuery({
    queryKey: queryKeys.projects(organizationId ?? ""),
    queryFn: () => projectsApi.getProjects(organizationId!),
    enabled: Boolean(organizationId),
    retry: false,
  });

  const projects = projectsQuery.data ?? [];
  const projectId = selectedProjectId || projects[0]?.id || "";
  const selectedProject = projects.find((item) => item.id === projectId);

  const resourceQueries = useQueries({
    queries: projects.map((project) => ({
      queryKey: queryKeys.tasks(organizationId ?? "", project.id),
      queryFn: () => projectsApi.getTasks(organizationId!, project.id),
      enabled: Boolean(organizationId),
      retry: false,
    })),
  });

  const statusQueries = useQueries({
    queries: projects.map((project) => ({
      queryKey: queryKeys.statuses(organizationId ?? "", project.id),
      queryFn: () => statusesApi.getStatuses(organizationId!, project.id),
      enabled: Boolean(organizationId),
      retry: false,
    })),
  });

  const tasks = useMemo(() => {
    const index = projects.findIndex((project) => project.id === projectId);
    return index >= 0 ? (resourceQueries[index]?.data ?? []) : [];
  }, [projectId, projects, resourceQueries]);

  const statuses = useMemo(() => {
    const index = projects.findIndex((project) => project.id === projectId);
    return index >= 0 ? (statusQueries[index]?.data ?? []) : [];
  }, [projectId, projects, statusQueries]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tasks;
    return tasks.filter((task) =>
      [task.name, task.description ?? "", String(task.sequenceId), task.priority]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [search, tasks]);

  const projectState = useProjectPage(organizationId, selectedProject ? selectedProject.name : "");

  if (!organizationId) return null;

  return (
    <div className="flex min-w-0 h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-col border-b px-3 py-2">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <div className="flex items-center rounded-lg bg-secondary p-0.5">
              <button type="button" onClick={() => setView("board")} className={`h-8 rounded-md px-2.5 text-xs font-medium ${view === "board" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                <IconLayoutKanban className="mr-1.5 inline size-3.5" /> Board
              </button>
              <button type="button" onClick={() => setView("list")} className={`h-8 rounded-md px-2.5 text-xs font-medium ${view === "list" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                <IconList className="mr-1.5 inline size-3.5" /> List
              </button>
            </div>
            <select value={projectId} onChange={(event) => setSelectedProjectId(event.target.value)} className="h-8 max-w-52 rounded-lg border bg-secondary px-2 text-xs">
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
            <div className="relative w-44 sm:w-56">
              <IconSearch className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks…" className="h-8 w-full rounded-lg border bg-secondary pl-8 text-xs outline-none focus:bg-background" />
            </div>
          </div>
          <button type="button" className="h-8 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground">
            <IconPlus className="mr-1.5 inline size-3.5" /> Add task
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {view === "board" ? (
          <KanbanBoard statuses={statuses} tasks={filteredTasks} onMove={() => undefined} onSelect={(task) => setSelectedTask({ projectId, taskId: task.id })} onAddTask={() => undefined} />
        ) : (
          <TaskList tasks={filteredTasks} statuses={statuses} onMove={() => undefined} onSelect={(task) => setSelectedTask({ projectId, taskId: task.id })} />
        )}
      </div>

      {selectedTask && (
        <TaskDetailPanel
          organizationId={organizationId}
          projectId={selectedTask.projectId}
          taskId={selectedTask.taskId}
          statuses={statuses}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
