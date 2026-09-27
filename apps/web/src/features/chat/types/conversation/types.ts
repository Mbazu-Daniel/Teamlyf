export interface OtherMember {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
}

export interface DirectMessagePreview {
  id: string; // The ID of the last message or conversation
  content: string; // The text of the last message
  createdAt: string; // ISO Date string of the last message
  otherMember: OtherMember; // Details of the person you are chatting with
  isCurrentUserSender: boolean; // Useful for showing "You: Hello" in the sidebar
  unreadCount: number; // For the notification badge
  
  // Threading Metadata (Standard for your message objects)
  hasThreadedMessage: boolean;
  threadCount: number;
  parentMessageId: string | null;
  lastReplyTime: string | null;
}