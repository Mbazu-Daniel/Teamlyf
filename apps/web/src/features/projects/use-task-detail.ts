import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  client,
  projectsApi,
  settingsApi,
  type ProjectTask,
  type TaskAssigneeInput,
  type UpdateTaskInput,
} from "@/lib/api";
import { taskPath } from "@/lib/api/paths";
import { getErrorMessage } from "@/lib/error-message";
import { queryKeys } from "@/lib/queryKeys";

export type TaskAssigneeRow = {
  id: string;
  kind: "member" | "agent";
  memberId: string | null;
  agentId: string | null;
};

export type TaskDetail = ProjectTask & {
  sequenceId: number;
  startDate: string | null;
  taskAssignees: TaskAssigneeRow[];
};

export function useTaskDetail(
  organizationId: string | undefined,
  projectId: string,
  taskId: string,
) {
  const queryClient = useQueryClient();
  const organizationKey = organizationId ?? "";
  const enabled = Boolean(organizationId);
  const taskKey = queryKeys.task(organizationKey, projectId, taskId);
  const tasksKey = queryKeys.tasks(organizationKey, projectId);

  const taskQuery = useQuery({
    queryKey: taskKey,
    queryFn: () => client.request<TaskDetail>(taskPath(organizationKey, projectId, taskId)),
    enabled,
    retry: false,
  });

  const membersQuery = useQuery({
    queryKey: queryKeys.members(organizationKey),
    queryFn: () => settingsApi.members(organizationKey),
    select: (page) => page.members,
    enabled,
    retry: false,
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateTaskInput) =>
      projectsApi.updateTask(organizationKey, projectId, taskId, input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: taskKey });
      const previous = queryClient.getQueryData<TaskDetail>(taskKey);
      if (previous) queryClient.setQueryData(taskKey, applyTaskPatch(previous, input));
      return { previous };
    },
    onError: (_input, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(taskKey, context.previous);
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: tasksKey }),
  });

  return {
    task: taskQuery.data ?? null,
    members: membersQuery.data ?? [],
    membersLoading: membersQuery.isLoading,
    loading: taskQuery.isLoading,
    error: getErrorMessage(taskQuery.error, "Unable to load task"),
    saveError: getErrorMessage(updateMutation.error, "Unable to update task"),
    saving: updateMutation.isPending,
    updateTask: updateMutation.mutate,
  };
}

function applyTaskPatch(task: TaskDetail, input: UpdateTaskInput): TaskDetail {
  return {
    ...task,
    name: input.name ?? task.name,
    description: input.description ?? task.description,
    statusId: input.statusId ?? task.statusId,
    priority: input.priority ?? task.priority,
    startDate: input.startDate ?? task.startDate,
    targetDate: input.targetDate ?? task.targetDate,
    taskAssignees: input.assignees
      ? input.assignees.map((assignee, index) => toOptimisticRow(assignee, index))
      : task.taskAssignees,
  };
}

function toOptimisticRow(assignee: TaskAssigneeInput, index: number): TaskAssigneeRow {
  return {
    id: `optimistic-${index}`,
    kind: assignee.kind,
    memberId: assignee.kind === "member" ? assignee.id : null,
    agentId: assignee.kind === "agent" ? assignee.id : null,
  };
}
