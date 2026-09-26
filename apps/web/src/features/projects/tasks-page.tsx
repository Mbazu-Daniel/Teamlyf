import { useMemo, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconPlus, IconSearch, IconX } from "@tabler/icons-react";
import { useOrganization } from "@/lib/organization";
import { projectsApi, statusesApi, type ProjectTask, type Status } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { TaskList } from "@/features/projects/task-list";
import { KanbanBoard } from "@/features/projects/board";
import { TaskDetailPanel } from "@/features/projects/task-detail-panel";

// fallow-ignore-next-line high-crap-score,high-cognitive-complexity -- task workspace coordinates several independent project mutations and views
export function TasksPage() {
  const { organization } = useOrganization();
  const { searchStr } = useLocation();
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [search, setSearch] = useState("");
  const [selectedTask, setSelectedTask] = useState<{ projectId: string; taskId: string } | null>(null);
  const [creating, setCreating] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [taskStatusId, setTaskStatusId] = useState("");

  const view = new URLSearchParams(searchStr).get("view") === "list" ? "list" : "board";
  const organizationId = organization?.id;

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

  const tasksKey = queryKeys.tasks(organizationId ?? "", projectId);

  const createTaskMutation = useMutation({
    mutationFn: () => projectsApi.createTask(organizationId!, projectId, {
      name: taskName.trim(),
      statusId: taskStatusId || statuses[0]?.id || "",
    }),
    onSuccess: (task) => {
      queryClient.setQueryData<ProjectTask[]>(tasksKey, (current) => [...(current ?? []), task]);
      setTaskName("");
      setCreating(false);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: tasksKey }),
  });

  const moveTaskMutation = useMutation({
    mutationFn: ({ taskId, statusId }: { taskId: string; statusId: string }) =>
      projectsApi.moveTask(organizationId!, projectId, taskId, statusId),
    onMutate: async ({ taskId, statusId }) => {
      await queryClient.cancelQueries({ queryKey: tasksKey });
      const previous = queryClient.getQueryData<ProjectTask[]>(tasksKey);
      queryClient.setQueryData<ProjectTask[]>(tasksKey, (current) =>
        (current ?? []).map((task) => task.id === taskId ? { ...task, statusId } : task),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(tasksKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: tasksKey }),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => projectsApi.deleteTask(organizationId!, projectId, taskId),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: tasksKey });
      const previous = queryClient.getQueryData<ProjectTask[]>(tasksKey);
      queryClient.setQueryData<ProjectTask[]>(tasksKey, (current) =>
        (current ?? []).filter((task) => task.id !== taskId),
      );
      return { previous };
    },
    onError: (_error, _taskId, context) => {
      if (context?.previous) queryClient.setQueryData(tasksKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: tasksKey }),
  });

  const duplicateTaskMutation = useMutation({
    mutationFn: (task: ProjectTask) =>
      projectsApi.createTask(organizationId!, projectId, {
        name: task.name + " (copy)",
        statusId: task.statusId,
      }),
    onSuccess: (task) => {
      queryClient.setQueryData<ProjectTask[]>(tasksKey, (current) => [...(current ?? []), task]);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: tasksKey }),
  });

  function openCreate() {
    setTaskStatusId(statuses[0]?.id ?? "");
    setCreating(true);
  }

  // fallow-ignore-next-line high-crap-score,high-cognitive-complexity -- form validation is intentionally kept next to the task creation mutation
  function createTask() {
    if (!organizationId || !projectId || !taskName.trim() || !(taskStatusId || statuses[0]?.id)) return;
    createTaskMutation.mutate();
  }

  if (!organizationId) return null;

  return (
    <div className="flex min-w-0 h-full w-full flex-col overflow-hidden bg-card">
      <div className="flex flex-col gap-3 border-b px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-tight">Tasks</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {selectedProject?.name ?? "Select a project"} · {filteredTasks.length} task{filteredTasks.length === 1 ? "" : "s"}
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            disabled={!projectId || statuses.length === 0}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-50"
          >
            <IconPlus className="size-3.5" /> Add task
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={projectId}
            onChange={(event) => setSelectedProjectId(event.target.value)}
            className="h-8 max-w-56 rounded-md border bg-background px-2 text-xs"
            aria-label="Project"
          >
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
          <div className="relative min-w-48 flex-1 sm:max-w-sm">
            <IconSearch className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tasks"
              className="h-8 w-full rounded-md border bg-background pl-8 pr-3 text-xs outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>

        {creating && (
          <form
            onSubmit={(event) => { event.preventDefault(); createTask(); }}
            className="flex flex-wrap items-center gap-2 rounded-lg border bg-background p-2"
          >
            <input
              value={taskName}
              onChange={(event) => setTaskName(event.target.value)}
              placeholder="Task name"
              className="h-8 min-w-56 flex-1 rounded-md border px-2.5 text-xs outline-none focus:ring-1 focus:ring-primary/30"
              autoFocus
              required
            />
            <select
              value={taskStatusId || statuses[0]?.id || ""}
              onChange={(event) => setTaskStatusId(event.target.value)}
              className="h-8 rounded-md border bg-background px-2 text-xs"
            >
              {statuses.map((status: Status) => <option key={status.id} value={status.id}>{status.name}</option>)}
            </select>
            <button
              type="submit"
              disabled={createTaskMutation.isPending || !taskName.trim()}
              className="h-8 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-50"
            >
              {createTaskMutation.isPending ? "Creating..." : "Create"}
            </button>
            <button type="button" onClick={() => setCreating(false)} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted" aria-label="Cancel">
              <IconX className="size-4" />
            </button>
          </form>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
        {view === "board" ? (
          <KanbanBoard
            statuses={statuses}
            tasks={filteredTasks}
            onMove={(task, statusId) => moveTaskMutation.mutate({ taskId: task.id, statusId })}
            onSelect={(task) => setSelectedTask({ projectId, taskId: task.id })}
            onAddTask={openCreate}
            onDelete={(task) => deleteTaskMutation.mutate(task.id)}
            onDuplicate={(task) => duplicateTaskMutation.mutate(task)}
          />
        ) : (
          <TaskList
            tasks={filteredTasks}
            statuses={statuses}
            onMove={(task, statusId) => moveTaskMutation.mutate({ taskId: task.id, statusId })}
            onSelect={(task) => setSelectedTask({ projectId, taskId: task.id })}
            onDelete={(task) => deleteTaskMutation.mutate(task.id)}
            onDuplicate={(task) => duplicateTaskMutation.mutate(task)}
          />
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
