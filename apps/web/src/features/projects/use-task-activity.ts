import { useQuery } from "@tanstack/react-query";
import { taskActivityApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/error-message";
import { queryKeys } from "@/lib/queryKeys";

/** Read-only timeline of one task; the API exposes no write endpoint for it. */
export function useTaskActivity(
  organizationId: string | undefined,
  projectId: string,
  taskId: string,
) {
  const organizationKey = organizationId ?? "";

  const activityQuery = useQuery({
    queryKey: queryKeys.activity(organizationKey, projectId, taskId),
    queryFn: () => taskActivityApi.getActivity(organizationKey, projectId, taskId),
    enabled: Boolean(organizationId),
    retry: false,
  });

  return {
    activities: activityQuery.data ?? [],
    loading: activityQuery.isLoading,
    error: getErrorMessage(activityQuery.error, "Unable to load activity"),
    retry: () => void activityQuery.refetch(),
  };
}
