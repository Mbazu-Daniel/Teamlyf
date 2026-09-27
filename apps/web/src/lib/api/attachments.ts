import { client, resolveApiPath } from "./client";
import { attachmentPath } from "./paths";

type TaskAttachment = {
  id: string;
  taskId: string;
  organizationId: string;
  memberId: string;
  fileKey: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
};

type AttachmentInput = {
  fileKey: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
};

export const attachmentsApi = {
  getAttachments(organizationId: string, projectId: string, taskId: string) {
    return client.request<TaskAttachment[]>(attachmentPath(organizationId, projectId, taskId));
  },
  requestUploadUrl(
    organizationId: string,
    projectId: string,
    taskId: string,
    input: { fileName: string; mimeType: string; fileSize: number },
  ) {
    return client.request<{ uploadUrl: string; fileKey: string; expiresAt: string }>(
      `${attachmentPath(organizationId, projectId, taskId)}/upload-url`,
      { method: "POST", body: JSON.stringify(input) },
    );
  },
  createAttachment(
    organizationId: string,
    projectId: string,
    taskId: string,
    input: AttachmentInput,
  ) {
    return client.request<TaskAttachment>(attachmentPath(organizationId, projectId, taskId), {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  getDownloadUrl(
    organizationId: string,
    projectId: string,
    taskId: string,
    attachmentId: string,
  ) {
    return client.request<{ url: string; fileName: string }>(
      `${attachmentPath(organizationId, projectId, taskId, attachmentId)}/download-url`,
    );
  },
  deleteAttachment(
    organizationId: string,
    projectId: string,
    taskId: string,
    attachmentId: string,
  ) {
    return client.request<null>(attachmentPath(organizationId, projectId, taskId, attachmentId), {
      method: "DELETE",
    });
  },
};

/**
 * The full upload handshake: reserve a signed URL, PUT the bytes at it, then
 * record the attachment. A failed PUT never leaves a row behind because the
 * confirm call is what creates it.
 */
export async function uploadTaskAttachment(
  organizationId: string,
  projectId: string,
  taskId: string,
  file: File,
) {
  const mimeType = file.type || "application/octet-stream";
  const { uploadUrl, fileKey } = await attachmentsApi.requestUploadUrl(
    organizationId,
    projectId,
    taskId,
    { fileName: file.name, mimeType, fileSize: file.size },
  );

  const upload = await fetch(resolveApiPath(uploadUrl), {
    method: "PUT",
    body: file,
    headers: { "Content-Type": mimeType },
  });
  if (!upload.ok) throw new Error("Upload failed");

  return attachmentsApi.createAttachment(organizationId, projectId, taskId, {
    fileKey,
    originalFileName: file.name,
    mimeType,
    fileSize: file.size,
  });
}
