export interface ChannelCreator {
  id: string;
  createdAt: string;
  tenantId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member' | string;
  firstName: string;
  lastName: string;
  updatedAt: string;
}

export interface Channel {
  id: string;
  createdAt: string;
  tenantId: string;
  name: string;
  description: string;
  createdById: string;
  updatedAt: string;
  deletedAt: string | null;
  createdBy: ChannelCreator;
  unreadCount: number;
  isMember: boolean;
  avatar?: string
  lastProcessedMessageId?: string
}

export interface ChannelMember {
  id: string;
  channelId: string;
  tenantMemberId: string;
  joinedAt: string;
  tenantMember: {
    id: string;
    firstName: string;
    lastName: string;
    user?: {
      image: string | null;
    }
  };
}
