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
  content: string; // Will be "" for voice notes/pure attachments
  createdAt: string;
  editedAt?: string | null;
  isCurrentUserMessage?: boolean;
  sender: ThreadSender;
  attachments?: ThreadAttachment[];
  parentMessageId?: string | null; // In a thread, this is usually mandatory
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
  
  // Optional UI helper for local state (optimistic updates)
  status?: 'sending' | 'success' | 'failed';
  attachmentIds?: string[];
}