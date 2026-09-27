import { Message } from "@/features/chat/types/messages/types";
import { TenantMember } from "@/features/chat/types/tenant-members/types";
import { ChatMessageItem } from "./chat-message-item";

interface ChatMessageListProps {
  messages: Message[];
  type: "channel" | "direct";
  chatId: string;
  currentMemberId?: string;
  membersToUse: TenantMember[];
  isSelectionMode: boolean;
  selectedIds: string[];
  tappedMessageId: string | null;
  bottomRef: React.RefObject<HTMLDivElement>;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  isFetchingNextPage?: boolean;
  onToggleSelection: (id: string) => void;
  onEnterSelectionMode: (id: string) => void;
  onSetTappedMessageId: (updater: (prev: string | null) => string | null) => void;
  onCancelSend: (tempId: string) => void;
  onRetrySend: (msg: Message) => void;
  onAddReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string, emoji: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onOpenThread: (message: Message) => void;
}

function ChatEmptyState({ type }: { type: "channel" | "direct" }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-12 h-full">
      <img
        className="dark:invert opacity-60"
        src="/assets/messy.svg"
        alt="Empty chat"
        width={240}
        height={160}
      />
      <p className="text-sm font-medium text-muted-foreground text-center">
        {type === "direct"
          ? "No messages yet. Start the conversation 👋"
          : "No discussions yet on this group"}
      </p>
    </div>
  );
}

export function ChatMessageList({
  messages,
  type,
  chatId,
  currentMemberId,
  membersToUse,
  isSelectionMode,
  selectedIds,
  tappedMessageId,
  bottomRef,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
  onToggleSelection,
  onEnterSelectionMode,
  onSetTappedMessageId,
  onCancelSend,
  onRetrySend,
  onAddReaction,
  onRemoveReaction,
  onDeleteMessage,
  onOpenThread,
}: ChatMessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto px-3 py-3">
      {messages.length === 0 ? (
        <ChatEmptyState type={type} />
      ) : (
        <div className="flex flex-col gap-1">
          {hasNextPage && (
            <div className="flex justify-center py-4">
              <button
                onClick={() => fetchNextPage && fetchNextPage()}
                disabled={isFetchingNextPage}
                className="px-4 py-1.5 bg-secondary text-secondary-foreground text-xs font-semibold rounded-full hover:bg-secondary/80 disabled:opacity-50 transition-colors"
              >
                {isFetchingNextPage ? "Loading older messages..." : "Load older messages"}
              </button>
            </div>
          )}
          {messages.map((msg) =>
            !msg.parentMessageId && (
              <ChatMessageItem
                key={msg.id}
                msg={msg}
                type={type}
                chatId={chatId}
                currentMemberId={currentMemberId}
                membersToUse={membersToUse}
                isSelectionMode={isSelectionMode}
                selectedIds={selectedIds}
                tappedMessageId={tappedMessageId}
                onToggleSelection={onToggleSelection}
                onEnterSelectionMode={onEnterSelectionMode}
                onSetTappedMessageId={onSetTappedMessageId}
                onCancelSend={onCancelSend}
                onRetrySend={onRetrySend}
                onAddReaction={onAddReaction}
                onRemoveReaction={onRemoveReaction}
                onDeleteMessage={onDeleteMessage}
                onOpenThread={onOpenThread}
              />
            )
          )}
          <div ref={bottomRef} className="h-2" />
        </div>
      )}
    </div>
  );
}
