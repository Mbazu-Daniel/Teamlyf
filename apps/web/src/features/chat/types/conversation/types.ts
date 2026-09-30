export interface OtherMember {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
}

export interface DirectMessagePreview {
  id: string;
  content: string;
  createdAt: string;
  otherMember: OtherMember;
  isCurrentUserSender: boolean;
  unreadCount: number;

  hasThreadedMessage: boolean;
  threadCount: number;
  parentMessageId: string | null;
  lastReplyTime: string | null;
}
