import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { attachmentsApi, resolveApiPath, uploadTaskAttachment } from "@/lib/api";
import { getErrorMessage } from "@/lib/error-message";
import { queryKeys } from "@/lib/queryKeys";

/**
 * One task's files plus the upload handshake behind them. The bytes travel
 * through a signed URL the API mints, so this hook only ever sees files.
 */
export function useTaskAttachments(
  organizationId: string | undefined,
  projectId: string,
  taskId: string,
) {
  const queryClient = useQueryClient();
  const organizationKey = organizationId ?? "";
  const enabled = Boolean(organizationId);
  const attachmentsKey = queryKeys.attachments(organizationKey, projectId, taskId);

  const attachmentsQuery = useQuery({
    queryKey: attachmentsKey,
    queryFn: () => attachmentsApi.getAttachments(organizationKey, projectId, taskId),
    enabled,
    retry: false,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadTaskAttachment(organizationKey, projectId, taskId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attachmentsKey });
      toast.success("Attachment uploaded");
    },
    onError: () => toast.error("Failed to upload attachment"),
  });

  const deleteMutation = useMutation({
    mutationFn: (attachmentId: string) =>
      attachmentsApi.deleteAttachment(organizationKey, projectId, taskId, attachmentId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: attachmentsKey }),
  });

  async function downloadAttachment(attachmentId: string) {
    const { url } = await attachmentsApi.getDownloadUrl(
      organizationKey,
      projectId,
      taskId,
      attachmentId,
    );
    window.open(resolveApiPath(url), "_blank", "noopener");
  }

  return {
    attachments: attachmentsQuery.data ?? [],
    loading: attachmentsQuery.isLoading,
    uploading: uploadMutation.isPending,
    deleting: deleteMutation.isPending,
    error: getErrorMessage(attachmentsQuery.error, "Unable to load attachments"),
    deleteError: getErrorMessage(deleteMutation.error, "Unable to delete attachment"),
    retry: () => void attachmentsQuery.refetch(),
    uploadFile: uploadMutation.mutate,
    deleteAttachment: deleteMutation.mutate,
    downloadAttachment,
  };
}
