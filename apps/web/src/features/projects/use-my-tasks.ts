import { useMemo } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectsApi, statusesApi, type Project, type ProjectTask, type Status } from "@/lib/api";
import { getErrorMessage } from "@/lib/error-message";
import { getMemberDisplayName } from "@/lib/tenant-members/member-display";
import { queryKeys } from "@/lib/queryKeys";
import { useGetCurrentUser } from "@/features/chat/data/queries/use-get-current-user-hook";
import { useFetchTenantMembers } from "@/features/chat/data/queries/use-fetch-tenant-members-hook";
import type { BoardColumnData } from "./board";
import {
  DATE_GROUP_META,
  dateGroupOf,
  groupRowsByDate,
  isDateGroupId,
  rescheduleDateFor,
  type DateGroup,
  type TaskListRow,
} from "./task-groups";

export type MyTaskRow = TaskListRow & Readonly<{ projectId: string }>;

export const ALL_ASSIGNEES = "all";

type BuildRowsInput = {
  projects: readonly Project[];
  tasksByProject: readonly (readonly ProjectTask[] | undefined)[];
  statusesByProject: readonly (readonly Status[] | undefined)[];

  memberId: string;

  assigneeId?: string;
  query?: string;
  projectFilter?: string;
  priority?: string;
};

export function buildMyTasksRows({
  projects,
  tasksByProject,
  statusesByProject,
  memberId,
  assigneeId = memberId,
  query = "",
  projectFilter = "all",
  priority = "all",
}: BuildRowsInput): MyTaskRow[] {
  const everyone = assigneeId === ALL_ASSIGNEES;
  const needle = query.trim().toLowerCase();
  const rows: MyTaskRow[] = [];
  projects.forEach((project, index) => {
    if (projectFilter !== "all" && project.id !== projectFilter) return;
    const statuses = statusesByProject[index] ?? [];
    const statusById = new Map(statuses.map((status) => [status.id, status]));
    for (const task of tasksByProject[index] ?? []) {
      if (!everyone && !isAssignedTo(task, assigneeId)) continue;
      if (priority !== "all" && task.priority !== priority) continue;
      if (needle && !matchesSearch(task, needle)) continue;
      rows.push({
        task,
        status: statusById.get(task.statusId),
        project: { name: project.name, emoji: project.emoji },
        projectId: project.id,
      });
    }
  });
  return rows;
}

function isAssignedTo(task: ProjectTask, memberId: string): boolean {
  return (
    task.taskAssignees?.some(
      (assignee) => assignee.kind === "member" && assignee.memberId === memberId,
    ) ?? false
  );
}

function matchesSearch(task: ProjectTask, needle: string): boolean {
  return [task.name, task.description ?? "", String(task.sequenceId), task.priority]
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

export function useMyTasks(
  organizationId: string | undefined,
  query: string,
  filters: { assigneeId?: string; projectFilter?: string; priority?: string } = {},
) {
  const queryClient = useQueryClient();
  const organizationKey = organizationId ?? "";
  const enabled = Boolean(organizationId);
  const member = useGetCurrentUser(organizationId ?? null);
  const members = useFetchTenantMembers(organizationKey, { enabled });

  const projectsQuery = useQuery({
    queryKey: queryKeys.projects(organizationKey),
    queryFn: () => projectsApi.getProjects(organizationKey),
    enabled,
    retry: false,
  });
  const projects = projectsQuery.data ?? [];

  const taskQueries = useQueries({
    queries: projects.map((project) => ({
      queryKey: queryKeys.tasks(organizationKey, project.id),
      queryFn: () => projectsApi.getTasks(organizationKey, project.id),
      enabled,
      retry: false,
    })),
  });
  const statusQueries = useQueries({
    queries: projects.map((project) => ({
      queryKey: queryKeys.statuses(organizationKey, project.id),
      queryFn: () => statusesApi.getStatuses(organizationKey, project.id),
      enabled,
      retry: false,
    })),
  });

  const tasksByProject = taskQueries.map((result) => result.data);
  const statusesByProject = statusQueries.map((result) => result.data);
  const statusesByProjectId = new Map(
    projects.map((project, index) => [project.id, statusesByProject[index] ?? []] as const),
  );
  const rows = member.data
    ? buildMyTasksRows({
        projects,
        tasksByProject,
        statusesByProject,
        memberId: member.data.id,
        query,
        ...filters,
      })
    : [];

  const assigneeOptions = useMemo(() => {
    const current = member.data?.id;
    return (members.data?.records ?? [])
      .map((entry) => ({ id: entry.id, name: getMemberDisplayName(entry) }))
      .sort((a, b) => {
        if (a.id === current) return -1;
        if (b.id === current) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [members.data, member.data?.id]);

  const groups: DateGroup[] = groupRowsByDate(rows);
  const columns: BoardColumnData[] = groups.map((group) => ({
    id: group.id,
    name: group.label,
    color: DATE_GROUP_META[group.id].color,
    droppable: DATE_GROUP_META[group.id].droppable,
    tasks: group.rows.map((row) => row.task),
  }));

  const loading =
    projectsQuery.isLoading ||
    member.isLoading ||
    taskQueries.some((result) => result.isLoading) ||
    statusQueries.some((result) => result.isLoading);
  const error =
    getErrorMessage(
      projectsQuery.error ??
        taskQueries.find((q) => q.error)?.error ??
        statusQueries.find((q) => q.error)?.error,
      "Unable to load your tasks",
    ) ?? getErrorMessage(member.error, "Unable to load your tasks");

  function invalidateProjects() {
    for (const project of projects)
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks(organizationKey, project.id),
      });
  }

  const moveMutation = useMutation({
    mutationFn: ({
      projectId,
      taskId,
      statusId,
    }: {
      projectId: string;
      taskId: string;
      statusId: string;
    }) => projectsApi.moveTask(organizationKey, projectId, taskId, statusId),
    onMutate: async ({ projectId, taskId, statusId }) => {
      const tasksKey = queryKeys.tasks(organizationKey, projectId);
      await queryClient.cancelQueries({ queryKey: tasksKey });
      const previous = queryClient.getQueryData<ProjectTask[]>(tasksKey);
      queryClient.setQueryData<ProjectTask[]>(tasksKey, (current) =>
        (current ?? []).map((task) => (task.id === taskId ? { ...task, statusId } : task)),
      );
      return { previous, tasksKey };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(context.tasksKey, context.previous);
    },
    onSettled: (_data, _error, variables) =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks(organizationKey, variables.projectId),
      }),
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({
      projectId,
      taskId,
      targetDate,
    }: {
      projectId: string;
      taskId: string;
      targetDate: string;
    }) => projectsApi.updateTask(organizationKey, projectId, taskId, { targetDate }),
    onMutate: async ({ projectId, taskId, targetDate }) => {
      const tasksKey = queryKeys.tasks(organizationKey, projectId);
      await queryClient.cancelQueries({ queryKey: tasksKey });
      const previous = queryClient.getQueryData<ProjectTask[]>(tasksKey);
      queryClient.setQueryData<ProjectTask[]>(tasksKey, (current) =>
        (current ?? []).map((task) => (task.id === taskId ? { ...task, targetDate } : task)),
      );
      return { previous, tasksKey };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(context.tasksKey, context.previous);
    },
    onSettled: (_data, _error, variables) =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks(organizationKey, variables.projectId),
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ projectId, taskId }: { projectId: string; taskId: string }) =>
      projectsApi.deleteTask(organizationKey, projectId, taskId),
    onSettled: invalidateProjects,
  });

  const duplicateMutation = useMutation({
    mutationFn: ({ projectId, task }: { projectId: string; task: ProjectTask }) =>
      projectsApi.createTask(organizationKey, projectId, {
        name: `${task.name} (copy)`,
        statusId: task.statusId,
      }),
    onSettled: invalidateProjects,
  });

  function locate(task: ProjectTask) {
    return rows.find((row) => row.task.id === task.id);
  }

  return {
    rows,
    assigneeOptions,
    currentMemberId: member.data?.id ?? null,
    groups,
    columns,
    loading,
    error,
    statusesByProjectId,

    moveToStatus(task: ProjectTask, statusId: string) {
      const row = locate(task);
      if (row) moveMutation.mutate({ projectId: row.projectId, taskId: task.id, statusId });
    },

    reschedule(task: ProjectTask, columnId: string) {
      if (!isDateGroupId(columnId) || dateGroupOf(task) === columnId) return;
      const row = locate(task);
      const target = rescheduleDateFor(columnId);
      if (row && target)
        rescheduleMutation.mutate({
          projectId: row.projectId,
          taskId: task.id,
          targetDate: target.toISOString(),
        });
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
