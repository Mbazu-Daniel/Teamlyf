interface ThreadAttachment {
  mimeType: string;
  fileSize: number;
  url: string;
}

interface ThreadSender {
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  avatarKey?: string;
  avatar: string | null;
}

export interface ThreadMessage {
  id: string;
  content: string;
  createdAt: string;
  editedAt?: string | null;
  isCurrentUserMessage?: boolean;
  sender: ThreadSender;
  attachments?: ThreadAttachment[];
  parentMessageId?: string | null;
  threadCount?: number;
  lastReplyTime?: string | null;
  type?: "channel" | "direct";
  channel?: {
    id: string;
    name: string;
  };
  conversation?: {
    id: string;
    otherMember: ThreadSender;
  };

  status?: "sending" | "success" | "failed";
  attachmentIds?: string[];
}
