export interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  /** Optional attachmentIds when files were uploaded, and optional mentionedUserIds */
  onSend: (
    attachmentIds?: string[],
    mentionedUserIds?: string[],
    finalContent?: string
  ) => void | Promise<void>;
  onTyping: () => void;
  tenantId: string;
  channelId?: string;
  conversationId?: string;
  type?: "channel" | "direct";
}

export type AttachmentStatus = "pending" | "uploading" | "success" | "failed";

export type ComposerAttachment = {
  file: File;
  status: AttachmentStatus;
  id?: string;
};
