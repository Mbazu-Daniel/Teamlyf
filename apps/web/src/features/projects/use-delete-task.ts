import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsApi, type ProjectTask } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

export function useDeleteTask(organizationId: string | undefined, projectId: string) {
  const queryClient = useQueryClient();
  const tasksKey = queryKeys.tasks(organizationId ?? "", projectId);

  return useMutation({
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
}
