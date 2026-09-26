import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { milestonesApi, projectsApi, statusesApi, type Milestone, type ProjectTask, type Status } from "@/lib/api";
import { getErrorMessage } from "@/lib/error-message";
import { queryKeys } from "@/lib/queryKeys";
import { slugify } from "@/lib/slug";

type CreateTaskInput = { name: string; statusId: string };
type MoveTaskInput = { taskId: string; statusId: string };

// fallow-ignore-next-line complexity -- project page hook intentionally centralizes task and milestone mutations for one project
export function useProjectPage(organizationId: string | undefined, projectSlug: string) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [statusId, setStatusId] = useState("");

  // Without an organization there is nothing to fetch; "" keeps the keys defined.
  const organizationKey = organizationId ?? "";
  const enabled = Boolean(organizationId);
  const projectsKey = queryKeys.projects(organizationKey);
  const projectsQuery = useQuery({
    queryKey: projectsKey,
    queryFn: () => projectsApi.getProjects(organizationKey),
    enabled,
    retry: false,
  });
  const project = projectsQuery.data?.find((item) => slugify(item.name) === projectSlug) ?? null;
  const projectId = project?.id ?? "";
  const projectKey = queryKeys.project(organizationKey, projectId);
  const statusesKey = queryKeys.statuses(organizationKey, projectId);
  const tasksKey = queryKeys.tasks(organizationKey, projectId);
  const milestonesKey = queryKeys.milestones(organizationKey, projectId);
  const projectEnabled = enabled && Boolean(projectId);

  const statusesQuery = useQuery({
    queryKey: statusesKey,
    queryFn: () => statusesApi.getStatuses(organizationKey, projectId),
    enabled: projectEnabled,
    retry: false,
  });

  const tasksQuery = useQuery({
    queryKey: tasksKey,
    queryFn: () => projectsApi.getTasks(organizationKey, projectId),
    enabled: projectEnabled,
    retry: false,
  });

  const milestonesQuery = useQuery({
    queryKey: milestonesKey,
    queryFn: () => milestonesApi.getMilestones(organizationKey, projectId),
    enabled: projectEnabled,
    retry: false,
  });

  const createTaskMutation = useMutation({
    mutationFn: (input: CreateTaskInput) =>
      projectsApi.createTask(organizationKey, projectId, input),
    onSuccess: (task) => {
      setName("");
      queryClient.setQueryData<ProjectTask[]>(tasksKey, (current) => [...(current ?? []), task]);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: tasksKey }),
  });


  const duplicateTaskMutation = useMutation({
    mutationFn: (task: ProjectTask) => projectsApi.createTask(organizationKey, projectId, { name: task.name + " (copy)", statusId: task.statusId }),
    onSuccess: (task) => queryClient.setQueryData<ProjectTask[]>(tasksKey, (current) => [...(current ?? []), task]),
    onSettled: () => queryClient.invalidateQueries({ queryKey: tasksKey }),
  });

  // fallow-ignore-next-line code-duplication -- optimistic task deletion follows the shared project-page mutation contract
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => projectsApi.deleteTask(organizationKey, projectId, taskId),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: tasksKey });
      const previous = queryClient.getQueryData<ProjectTask[]>(tasksKey);
      queryClient.setQueryData<ProjectTask[]>(tasksKey, (current) => (current ?? []).filter((task) => task.id !== taskId));
      return { previous };
    },
    onError: (_error, _taskId, context) => { if (context?.previous) queryClient.setQueryData(tasksKey, context.previous); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: tasksKey }),
  });

  const createMilestoneMutation = useMutation({
    mutationFn: (input: { name: string; description?: string; startDate?: string; targetDate?: string }) =>
      milestonesApi.createMilestone(organizationKey, projectId, input),
    onSuccess: (milestone) => {
      queryClient.setQueryData<Milestone[]>(milestonesKey, (current) => [milestone, ...(current ?? [])]);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: milestonesKey }),
  });

  const updateMilestoneMutation = useMutation({
    mutationFn: ({ milestoneId, ...input }: { milestoneId: string; name?: string; description?: string; status?: import("@/lib/api").MilestoneStatus; startDate?: string; targetDate?: string }) =>
      milestonesApi.updateMilestone(organizationKey, projectId, milestoneId, input),
    onSuccess: (updated) => {
      queryClient.setQueryData<Milestone[]>(milestonesKey, (current) =>
        (current ?? []).map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: milestonesKey }),
  });

  const deleteMilestoneMutation = useMutation({
    mutationFn: (milestoneId: string) => milestonesApi.deleteMilestone(organizationKey, projectId, milestoneId),
    onMutate: async (milestoneId) => {
      await queryClient.cancelQueries({ queryKey: milestonesKey });
      const previous = queryClient.getQueryData<Milestone[]>(milestonesKey);
      queryClient.setQueryData<Milestone[]>(milestonesKey, (current) =>
        (current ?? []).filter((milestone) => milestone.id !== milestoneId),
      );
      return { previous };
    },
    onError: (_error, _milestoneId, context) => {
      if (context?.previous) queryClient.setQueryData(milestonesKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: milestonesKey }),
  });

  const addMilestoneTaskMutation = useMutation({
    mutationFn: (input: { milestoneId: string; taskId: string }) =>
      milestonesApi.createMilestoneTask(organizationKey, projectId, input.milestoneId, input.taskId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: milestonesKey });
      queryClient.invalidateQueries({ queryKey: tasksKey });
    },
  });

  const removeMilestoneTaskMutation = useMutation({
    mutationFn: (input: { milestoneId: string; taskId: string }) =>
      milestonesApi.deleteMilestoneTask(organizationKey, projectId, input.milestoneId, input.taskId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: milestonesKey });
      queryClient.invalidateQueries({ queryKey: tasksKey });
    },
  });

  const moveTaskMutation = useMutation({
    mutationFn: (input: MoveTaskInput) =>
      projectsApi.moveTask(organizationKey, projectId, input.taskId, input.statusId),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: tasksKey });
      const previous = queryClient.getQueryData<ProjectTask[]>(tasksKey);
      queryClient.setQueryData<ProjectTask[]>(tasksKey, (current) =>
        (current ?? []).map((task) =>
          task.id === input.taskId ? { ...task, statusId: input.statusId } : task,
        ),
      );
      return { previous };
    },
    onError: (_input, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(tasksKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: tasksKey }),
  });

  const statuses = statusesQuery.data ?? [];
  const selectedStatusId = resolveStatusId(statusId, statuses);

  function createTask(event: FormEvent) {
    event.preventDefault();
    if (!organizationId || !isTaskFormValid(name, selectedStatusId)) return;
    createTaskMutation.mutate({ name: name.trim(), statusId: selectedStatusId });
  }

  function moveTask(task: ProjectTask, nextStatusId: string) {
    if (!organizationId || task.statusId === nextStatusId) return;
    moveTaskMutation.mutate({ taskId: task.id, statusId: nextStatusId });
  }

  const error =
    getErrorMessage(createTaskMutation.error, "Unable to create task") ??
    getErrorMessage(duplicateTaskMutation.error, "Unable to duplicate task") ??
    getErrorMessage(deleteTaskMutation.error, "Unable to delete task") ??
    getErrorMessage(createMilestoneMutation.error, "Unable to create milestone") ??
    getErrorMessage(updateMilestoneMutation.error, "Unable to update milestone") ??
    getErrorMessage(deleteMilestoneMutation.error, "Unable to update milestones") ??
    getErrorMessage(moveTaskMutation.error, "Unable to update task") ??
    getErrorMessage(
      projectsQuery.error ?? statusesQuery.error ?? tasksQuery.error,
      "Unable to load project",
    );

  return {
    project,
    statuses,
    tasks: tasksQuery.data ?? [],
    milestones: milestonesQuery.data ?? [],
    milestonesLoading: milestonesQuery.isLoading,
    name,
    statusId: selectedStatusId,
    loading: createTaskMutation.isPending,
    error,
    setName,
    setStatusId,
    createTask,
    moveTask,
    duplicateTask: duplicateTaskMutation.mutate,
    deleteTask: deleteTaskMutation.mutate,
    createMilestone: createMilestoneMutation.mutate,
    updateMilestone: updateMilestoneMutation.mutate,
    deleteMilestone: deleteMilestoneMutation.mutate,
    addTaskToMilestone: addMilestoneTaskMutation.mutate,
    removeTaskFromMilestone: removeMilestoneTaskMutation.mutate,
  };
}

function isTaskFormValid(name: string, statusId: string) {
  return Boolean(name.trim() && statusId);
}

/**
 * The select must land on a status that exists in this project: the stored pick
 * survives refetches, anything stale (first render, other project) falls back to
 * the first status, exactly what the old load used to seed.
 */
function resolveStatusId(storedId: string, statuses: Status[]) {
  return statuses.some((item) => item.id === storedId)
    ? storedId
    : (statuses[0]?.id ?? "");
}
