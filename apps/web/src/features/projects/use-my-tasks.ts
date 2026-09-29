import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectsApi, statusesApi, type Project, type ProjectTask, type Status } from "@/lib/api";
import { getErrorMessage } from "@/lib/error-message";
import { queryKeys } from "@/lib/queryKeys";
import { useGetCurrentUser } from "@/features/chat/data/queries/use-get-current-user-hook";
import type { BoardColumnData } from "./board";
import { DATE_GROUP_META, dateGroupOf, groupRowsByDate, isDateGroupId, rescheduleDateFor, type DateGroup, type TaskListRow } from "./task-groups";

export type MyTaskRow = TaskListRow & Readonly<{ projectId: string }>;

type BuildRowsInput = {
  projects: readonly Project[];
  tasksByProject: readonly (readonly ProjectTask[] | undefined)[];
  statusesByProject: readonly (readonly Status[] | undefined)[];
  memberId: string;
  query?: string;
  scope?: "mine" | "all";
  projectFilter?: string;
  priority?: string;
};

/**
 * Every task assigned to `memberId`, across every project, tagged with its
 * project and resolved status so the list and the board can render a flat row
 * set without re-querying. Pure — the hook below only supplies the fetches.
 */
export function buildMyTasksRows({ projects, tasksByProject, statusesByProject, memberId, query = "", scope = "mine", projectFilter = "all", priority = "all" }: BuildRowsInput): MyTaskRow[] {
  const needle = query.trim().toLowerCase();
  const rows: MyTaskRow[] = [];
  projects.forEach((project, index) => {
    if (projectFilter !== "all" && project.id !== projectFilter) return;
    const statuses = statusesByProject[index] ?? [];
    const statusById = new Map(statuses.map((status) => [status.id, status]));
    for (const task of tasksByProject[index] ?? []) {
      const assignedToMe = task.taskAssignees?.some((assignee) => assignee.kind === "member" && assignee.memberId === memberId) ?? false;
      if (scope === "mine" && !assignedToMe) continue;
      if (priority !== "all" && task.priority !== priority) continue;
      if (needle && !matchesSearch(task, needle)) continue;
      rows.push({ task, status: statusById.get(task.statusId), project: { name: project.name, emoji: project.emoji }, projectId: project.id });
    }
  });
  return rows;
}

function matchesSearch(task: ProjectTask, needle: string): boolean {
  return [task.name, task.description ?? "", String(task.sequenceId), task.priority].join(" ").toLowerCase().includes(needle);
}

/**
 * Cross-project My Tasks data: projects, their tasks and statuses, and the
 * caller's own membership, which is the assignee filter.
 */
export function useMyTasks(organizationId: string | undefined, query: string, filters: { scope?: "mine" | "all"; projectFilter?: string; priority?: string } = {}) {
  const queryClient = useQueryClient();
  const organizationKey = organizationId ?? "";
  const enabled = Boolean(organizationId);
  const member = useGetCurrentUser(organizationId ?? null);

  const projectsQuery = useQuery({
    queryKey: queryKeys.projects(organizationKey),
    queryFn: () => projectsApi.getProjects(organizationKey),
    enabled,
    retry: false,
  });
  const projects = projectsQuery.data ?? [];

  const taskQueries = useQueries({ queries: projects.map((project) => ({ queryKey: queryKeys.tasks(organizationKey, project.id), queryFn: () => projectsApi.getTasks(organizationKey, project.id), enabled, retry: false })) });
  const statusQueries = useQueries({ queries: projects.map((project) => ({ queryKey: queryKeys.statuses(organizationKey, project.id), queryFn: () => statusesApi.getStatuses(organizationKey, project.id), enabled, retry: false })) });

  const tasksByProject = taskQueries.map((result) => result.data);
  const statusesByProject = statusQueries.map((result) => result.data);
  const statusesByProjectId = new Map(projects.map((project, index) => [project.id, statusesByProject[index] ?? []] as const));
  const rows = member.data ? buildMyTasksRows({ projects, tasksByProject, statusesByProject, memberId: member.data.id, query, ...filters }) : [];

  const groups: DateGroup[] = groupRowsByDate(rows);
  const columns: BoardColumnData[] = groups.map((group) => ({ id: group.id, name: group.label, color: DATE_GROUP_META[group.id].color, droppable: DATE_GROUP_META[group.id].droppable, tasks: group.rows.map((row) => row.task) }));

  const loading = projectsQuery.isLoading || member.isLoading || taskQueries.some((result) => result.isLoading) || statusQueries.some((result) => result.isLoading);
  const error = getErrorMessage(projectsQuery.error ?? taskQueries.find((q) => q.error)?.error ?? statusQueries.find((q) => q.error)?.error, "Unable to load your tasks") ?? getErrorMessage(member.error, "Unable to load your tasks");

  function invalidateProjects() {
    for (const project of projects) void queryClient.invalidateQueries({ queryKey: queryKeys.tasks(organizationKey, project.id) });
  }

  const moveMutation = useMutation({
    mutationFn: ({ projectId, taskId, statusId }: { projectId: string; taskId: string; statusId: string }) => projectsApi.moveTask(organizationKey, projectId, taskId, statusId),
    onMutate: async ({ projectId, taskId, statusId }) => {
      const tasksKey = queryKeys.tasks(organizationKey, projectId);
      await queryClient.cancelQueries({ queryKey: tasksKey });
      const previous = queryClient.getQueryData<ProjectTask[]>(tasksKey);
      queryClient.setQueryData<ProjectTask[]>(tasksKey, (current) => (current ?? []).map((task) => task.id === taskId ? { ...task, statusId } : task));
      return { previous, tasksKey };
    },
    onError: (_error, _variables, context) => { if (context?.previous) queryClient.setQueryData(context.tasksKey, context.previous); },
    onSettled: (_data, _error, variables) => queryClient.invalidateQueries({ queryKey: queryKeys.tasks(organizationKey, variables.projectId) }),
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({ projectId, taskId, targetDate }: { projectId: string; taskId: string; targetDate: string }) => projectsApi.updateTask(organizationKey, projectId, taskId, { targetDate }),
    onMutate: async ({ projectId, taskId, targetDate }) => {
      const tasksKey = queryKeys.tasks(organizationKey, projectId);
      await queryClient.cancelQueries({ queryKey: tasksKey });
      const previous = queryClient.getQueryData<ProjectTask[]>(tasksKey);
      queryClient.setQueryData<ProjectTask[]>(tasksKey, (current) => (current ?? []).map((task) => task.id === taskId ? { ...task, targetDate } : task));
      return { previous, tasksKey };
    },
    onError: (_error, _variables, context) => { if (context?.previous) queryClient.setQueryData(context.tasksKey, context.previous); },
    onSettled: (_data, _error, variables) => queryClient.invalidateQueries({ queryKey: queryKeys.tasks(organizationKey, variables.projectId) }),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ projectId, taskId }: { projectId: string; taskId: string }) => projectsApi.deleteTask(organizationKey, projectId, taskId),
    onSettled: invalidateProjects,
  });

  const duplicateMutation = useMutation({
    mutationFn: ({ projectId, task }: { projectId: string; task: ProjectTask }) => projectsApi.createTask(organizationKey, projectId, { name: `${task.name} (copy)`, statusId: task.statusId }),
    onSettled: invalidateProjects,
  });

  function locate(task: ProjectTask) {
    return rows.find((row) => row.task.id === task.id);
  }

  return {
    rows,
    groups,
    columns,
    loading,
    error,
    statusesByProjectId,
    /** Move to an explicit status of the task's own project (the card's select). */
    moveToStatus(task: ProjectTask, statusId: string) {
      const row = locate(task);
      if (row) moveMutation.mutate({ projectId: row.projectId, taskId: task.id, statusId });
    },
    /**
     * Move a card to the date bucket it was dropped on. A card already in that
     * bucket writes nothing, and "no due date" has no representable write, so
     * neither produces a request.
     */
    reschedule(task: ProjectTask, columnId: string) {
      if (!isDateGroupId(columnId) || dateGroupOf(task) === columnId) return;
      const row = locate(task);
      const target = rescheduleDateFor(columnId);
      if (row && target) rescheduleMutation.mutate({ projectId: row.projectId, taskId: task.id, targetDate: target.toISOString() });
    },
    deleteTask(task: ProjectTask) {
      const row = locate(task);
      if (row) deleteMutation.mutate({ projectId: row.projectId, taskId: task.id });
    },
    duplicateTask(task: ProjectTask) {
      const row = locate(task);
      if (row) duplicateMutation.mutate({ projectId: row.projectId, task });
    },
  };
}
