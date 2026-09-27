import { Message } from "@/features/chat/types/messages/types";
import { DirectMessagePreview } from "@/features/chat/types/conversation/types";
import { Channel } from "@/features/chat/types/channel/types";

export interface ChatViewProps {
  chatTitle?: string;
  chatSubtitle?: string;
  messages: Message[];
  type: "channel" | "direct";
  isLoading: boolean;
  typingUsers: string[];
  onCancelSend: (tempId: string) => void;
  onRetrySend: (msg: Message) => void;
  bottomRef: React.RefObject<HTMLDivElement>;
  composer: React.ReactNode;
  conversation?: DirectMessagePreview;
  channel?: Channel;
  chatId: string;
  currentMemberId?: string;
  onAddReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string, emoji: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onBulkDelete?: (messageIds: string[]) => void;
  isBulkDeleting?: boolean;
  onCall?: () => void;
  ongoingCallBanner?: React.ReactNode;
  onSearch?: () => void;
  onInfo?: () => void;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  isFetchingNextPage?: boolean;
}
