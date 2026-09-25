import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { projectsApi, statusesApi, type ProjectTask, type Status } from "@/lib/api";
import { getErrorMessage } from "@/lib/error-message";
import { queryKeys } from "@/lib/queryKeys";

type CreateTaskInput = { name: string; statusId: string };
type MoveTaskInput = { taskId: string; statusId: string };

export function useProjectPage(organizationId: string | undefined, projectId: string) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [statusId, setStatusId] = useState("");

  // Without an organization there is nothing to fetch; "" keeps the keys defined.
  const organizationKey = organizationId ?? "";
  const enabled = Boolean(organizationId);
  const projectKey = queryKeys.project(organizationKey, projectId);
  const statusesKey = queryKeys.statuses(organizationKey, projectId);
  const tasksKey = queryKeys.tasks(organizationKey, projectId);

  const projectQuery = useQuery({
    queryKey: projectKey,
    queryFn: () => projectsApi.get(organizationKey, projectId),
    enabled,
    retry: false,
  });

  const statusesQuery = useQuery({
    queryKey: statusesKey,
    queryFn: () => statusesApi.getStatuses(organizationKey, projectId),
    enabled,
    retry: false,
  });

  const tasksQuery = useQuery({
    queryKey: tasksKey,
    queryFn: () => projectsApi.getTasks(organizationKey, projectId),
    enabled,
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
    getErrorMessage(moveTaskMutation.error, "Unable to update task") ??
    getErrorMessage(
      projectQuery.error ?? statusesQuery.error ?? tasksQuery.error,
      "Unable to load project",
    );

  return {
    project: projectQuery.data ?? null,
    statuses,
    tasks: tasksQuery.data ?? [],
    name,
    statusId: selectedStatusId,
    loading: createTaskMutation.isPending,
    error,
    setName,
    setStatusId,
    createTask,
    moveTask,
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
