import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { commentsApi, type Comment } from "@/lib/api";
import { getErrorMessage } from "@/lib/error-message";
import { queryKeys } from "@/lib/queryKeys";
import { useSession } from "@/lib/session";

type CreateCommentVariables = { body: string; actorId: string };
type UpdateCommentVariables = { commentId: string; body: string };

let draftSequence = 0;

export function useTaskComments(
  organizationId: string | undefined,
  projectId: string,
  taskId: string,
) {
  const queryClient = useQueryClient();
  const organizationKey = organizationId ?? "";
  const enabled = Boolean(organizationId);
  const commentsKey = queryKeys.comments(organizationKey, projectId, taskId);
  const activityKey = queryKeys.activity(organizationKey, projectId, taskId);
  const session = useSession();

  const commentsQuery = useQuery({
    queryKey: commentsKey,
    queryFn: () => commentsApi.getComments(organizationKey, projectId, taskId),
    enabled,
    retry: false,
  });

  function invalidateThread() {
    queryClient.invalidateQueries({ queryKey: commentsKey });
    queryClient.invalidateQueries({ queryKey: activityKey });
  }

  const createMutation = useMutation({
    mutationFn: (variables: CreateCommentVariables) =>
      commentsApi.createComment(organizationKey, projectId, taskId, { body: variables.body }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: commentsKey });
      const previous = queryClient.getQueryData<Comment[]>(commentsKey);

      queryClient.setQueryData<Comment[]>(commentsKey, (current) => [
        draftComment(taskId, variables),
        ...(current ?? []),
      ]);
      return { previous };
    },
    onError: (_variables, _input, context) => {
      if (context?.previous) queryClient.setQueryData(commentsKey, context.previous);
    },
    onSettled: invalidateThread,
  });

  const updateMutation = useMutation({
    mutationFn: (variables: UpdateCommentVariables) =>
      commentsApi.updateComment(organizationKey, projectId, taskId, variables.commentId, {
        body: variables.body,
      }),
    onSettled: invalidateThread,
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) =>
      commentsApi.deleteComment(organizationKey, projectId, taskId, commentId),
    onSettled: invalidateThread,
  });

  function createComment(body: string, onPosted?: () => void) {
    const trimmed = body.trim();
    const actorId = session.data?.user?.id;
    if (!trimmed || !actorId) return;
    createMutation.mutate({ body: trimmed, actorId }, { onSuccess: onPosted });
  }

  return {
    comments: commentsQuery.data ?? [],
    currentUserId: session.data?.user?.id ?? null,
    loading: commentsQuery.isLoading,
    creating: createMutation.isPending,
    updating: updateMutation.isPending,
    error: getErrorMessage(commentsQuery.error, "Unable to load comments"),
    createError: getErrorMessage(createMutation.error, "Unable to post comment"),
    updateError: getErrorMessage(updateMutation.error, "Unable to edit comment"),
    deleteError: getErrorMessage(deleteMutation.error, "Unable to delete comment"),
    retry: () => void commentsQuery.refetch(),
    createComment,
    updateComment: updateMutation.mutate,
    deleteComment: deleteMutation.mutate,
  };
}

function draftComment(taskId: string, variables: CreateCommentVariables): Comment {
  draftSequence += 1;
  const now = new Date().toISOString();
  return {
    id: `draft-${draftSequence}`,
    taskId,
    parentId: null,
    actorId: variables.actorId,
    body: variables.body,
    createdAt: now,
    updatedAt: now,
  };
}
