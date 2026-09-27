import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  taskRelationsApi,
  taskSubscribersApi,
  type TaskRelationType,
} from "@/lib/api";
import { getErrorMessage } from "@/lib/error-message";
import { queryKeys } from "@/lib/queryKeys";

/**
 * One task's cross-task links: blockers, related work, duplicates. Relations
 * are stored once with a direction, so the list holds both the rows this task
 * created and the rows pointing at it.
 */
export function useTaskRelations(
  organizationId: string | undefined,
  projectId: string,
  taskId: string,
) {
  const queryClient = useQueryClient();
  const organizationKey = organizationId ?? "";
  const enabled = Boolean(organizationId);
  const relationsKey = queryKeys.relations(organizationKey, projectId, taskId);
  const activityKey = queryKeys.activity(organizationKey, projectId, taskId);

  const relationsQuery = useQuery({
    queryKey: relationsKey,
    queryFn: () => taskRelationsApi.getRelations(organizationKey, projectId, taskId),
    enabled,
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: (input: { targetTaskId: string; relationType: TaskRelationType }) =>
      taskRelationsApi.createRelation(organizationKey, projectId, taskId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: relationsKey });
      queryClient.invalidateQueries({ queryKey: activityKey });
      toast.success("Relation added");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Failed to add relation")),
  });

  const deleteMutation = useMutation({
    mutationFn: (relationId: string) =>
      taskRelationsApi.deleteRelation(organizationKey, projectId, taskId, relationId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: relationsKey });
      queryClient.invalidateQueries({ queryKey: activityKey });
    },
  });

  return {
    relations: relationsQuery.data ?? [],
    loading: relationsQuery.isLoading,
    error: getErrorMessage(relationsQuery.error, "Unable to load relations"),
    createError: getErrorMessage(createMutation.error, "Unable to add relation"),
    deleteError: getErrorMessage(deleteMutation.error, "Unable to remove relation"),
    creating: createMutation.isPending,
    retry: () => void relationsQuery.refetch(),
    addRelation: createMutation.mutate,
    deleteRelation: deleteMutation.mutate,
  };
}

/** The members watching a task for updates, plus the opt-in/out mutations. */
export function useTaskSubscribers(
  organizationId: string | undefined,
  projectId: string,
  taskId: string,
) {
  const queryClient = useQueryClient();
  const organizationKey = organizationId ?? "";
  const enabled = Boolean(organizationId);
  const subscribersKey = queryKeys.subscribers(organizationKey, projectId, taskId);
  const activityKey = queryKeys.activity(organizationKey, projectId, taskId);

  const subscribersQuery = useQuery({
    queryKey: subscribersKey,
    queryFn: () => taskSubscribersApi.getSubscribers(organizationKey, projectId, taskId),
    enabled,
    retry: false,
  });

  const subscribeMutation = useMutation({
    mutationFn: (memberId: string) =>
      taskSubscribersApi.subscribe(organizationKey, projectId, taskId, { memberId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscribersKey });
      queryClient.invalidateQueries({ queryKey: activityKey });
      toast.success("Member subscribed");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Failed to subscribe member")),
  });

  const unsubscribeMutation = useMutation({
    mutationFn: (memberId: string) =>
      taskSubscribersApi.unsubscribe(organizationKey, projectId, taskId, memberId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: subscribersKey });
      queryClient.invalidateQueries({ queryKey: activityKey });
    },
  });

  return {
    subscribers: subscribersQuery.data ?? [],
    loading: subscribersQuery.isLoading,
    error: getErrorMessage(subscribersQuery.error, "Unable to load subscribers"),
    subscribeError: getErrorMessage(subscribeMutation.error, "Unable to subscribe member"),
    unsubscribeError: getErrorMessage(
      unsubscribeMutation.error,
      "Unable to unsubscribe member",
    ),
    retry: () => void subscribersQuery.refetch(),
    subscribe: subscribeMutation.mutate,
    unsubscribe: unsubscribeMutation.mutate,
  };
}