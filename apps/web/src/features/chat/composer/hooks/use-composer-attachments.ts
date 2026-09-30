import { useState } from "react";
import { toast } from "sonner";
import { useUploadAttachment } from "@/features/chat/data/mutations/use-upload-attachment-hook";
import type { ComposerAttachment } from "../types";

type UseComposerAttachmentsArgs = {
  tenantId: string;
  channelId?: string;
  conversationId?: string;
};

export function useComposerAttachments({
  tenantId,
  channelId,
  conversationId,
}: UseComposerAttachmentsArgs) {
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const uploadAttachment = useUploadAttachment();

  const addFiles = (files: File[]) => {
    if (files.length === 0) return;
    setAttachments((prev) => [
      ...prev,
      ...files.map((f) => ({
        file: f,
        status: "pending" as const,
      })),
    ]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addFiles(Array.from(files));
      e.target.value = "";
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const newFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) newFiles.push(file);
      }
    }
    if (newFiles.length > 0) {
      addFiles(newFiles);
      e.preventDefault();
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    const ids: string[] = [];
    for (let i = 0; i < attachments.length; i++) {
      const att = attachments[i];
      if (att.status !== "pending") continue;
      try {
        setAttachments((prev) =>
          prev.map((a, idx) => (idx === i ? { ...a, status: "uploading" } : a)),
        );
        const attachmentId = await uploadAttachment.mutateAsync({
          tenantId,
          fileName: att.file.name,
          mimeType: att.file.type,
          fileSize: att.file.size,
          channelId,
          conversationId,
          file: att.file,
        });
        setAttachments((prev) =>
          prev.map((a, idx) => (idx === i ? { ...a, status: "success", id: attachmentId } : a)),
        );
        ids.push(attachmentId);
      } catch {
        setAttachments((prev) =>
          prev.map((a, idx) => (idx === i ? { ...a, status: "failed" } : a)),
        );
        toast.error("Failed to upload attachment");
      }
    }
    return ids;
  };

  const retryUpload = async (index: number) => {
    const att = attachments[index];
    if (!att || att.status !== "failed") return;
    try {
      setAttachments((prev) =>
        prev.map((a, idx) => (idx === index ? { ...a, status: "uploading" } : a)),
      );
      const attachmentId = await uploadAttachment.mutateAsync({
        tenantId,
        fileName: att.file.name,
        mimeType: att.file.type,
        fileSize: att.file.size,
        channelId,
        conversationId,
        file: att.file,
      });
      setAttachments((prev) =>
        prev.map((a, idx) => (idx === index ? { ...a, status: "success", id: attachmentId } : a)),
      );
    } catch {
      setAttachments((prev) =>
        prev.map((a, idx) => (idx === index ? { ...a, status: "failed" } : a)),
      );
      toast.error("Failed to upload attachment");
    }
  };

  const clearAttachments = () => setAttachments([]);

  return {
    attachments,
    setAttachments,
    isUploading,
    setIsUploading,
    handleFileSelect,
    handlePaste,
    removeAttachment,
    uploadFiles,
    retryUpload,
    clearAttachments,
  };
}
