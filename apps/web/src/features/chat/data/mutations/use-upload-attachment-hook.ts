import { useMutation } from "@tanstack/react-query";
import api from "@/features/chat/data/http";
import { CONFIG } from "@/features/chat/data/config";
import { resolveApiPath } from "@/lib/api/client";

interface UploadAttachmentParams {
  tenantId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  channelId?: string;
  conversationId?: string;
}

interface UploadResult {
  attachmentId: string;
  uploadUrl: string;
}

export function useUploadAttachment() {
  return useMutation({
    mutationFn: async (params: UploadAttachmentParams & { file: File }): Promise<string> => {
      const { tenantId, fileName, mimeType, fileSize, channelId, conversationId, file } = params;

      const targetPayload = channelId ? { channelId } : conversationId ? { conversationId } : {};

      // Get upload URL
      const res = await api.post(CONFIG.API_ENDPOINTS.FILES.ATTACHMENTS(tenantId), {
        fileName,
        mimeType,
        fileSize,
        ...targetPayload
      });

      const { attachmentId, uploadUrl } = res.data as UploadResult;

      // Upload file
      const response = await fetch(resolveApiPath(uploadUrl), {
        method: "PUT",
        body: file,
        headers: { "Content-Type": mimeType },
        credentials: "include",
      });
      if (!response.ok) throw new Error(`Upload failed (${response.status})`);

      return attachmentId;
    }
  });
}