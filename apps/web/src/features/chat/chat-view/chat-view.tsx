import { useState } from "react";
import { useThreadStore } from "@/lib/store/ui-stores";
import { Message } from "@/features/chat/types/messages/types";
import { ChatLoadingSkeleton } from "./chat-loading-skeleton";
import { ChatMessageList } from "./chat-message-list";
import { ChatSelectionBar } from "./chat-selection-bar";
import { ChatViewHeader } from "./chat-view-header";
import { TypingIndicator } from "./typing-indicator";
import { useChatMembers } from "./hooks/use-chat-members";
import { useChatSelection } from "./hooks/use-chat-selection";
import type { ChatViewProps } from "./types";

export function ChatView({
  chatTitle, chatSubtitle, messages, type, isLoading,
  typingUsers, onCancelSend, onRetrySend, bottomRef,
  composer, conversation, channel, chatId,
  currentMemberId, onAddReaction, onRemoveReaction, onDeleteMessage,
  onCall,
  ongoingCallBanner,
  onSearch,
  onInfo,
  onBulkDelete,
  isBulkDeleting,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
}: ChatViewProps) {
  const { setChatId, setIsThreadOpen, setActiveThread } = useThreadStore();
  const [tappedMessageId, setTappedMessageId] = useState<string | null>(null);

  const {
    isSelectionMode,
    selectedIds,
    toggleSelection,
    enterSelectionMode,
    exitSelectionMode,
    handleBulkDeleteMsg,
  } = useChatSelection(onBulkDelete);

  const membersToUse = useChatMembers(chatId, type);

  function openThread(message: Message) {
    setChatId(chatId);
    setIsThreadOpen(true);
    setActiveThread({ message, type });
  }

  if (isLoading) {
    return <ChatLoadingSkeleton />;
  }

  return (
    <div className="relative flex h-full flex-col bg-card">
      {isSelectionMode && (
        <ChatSelectionBar
          selectedCount={selectedIds.length}
          onExit={exitSelectionMode}
          onBulkDelete={handleBulkDeleteMsg}
          isBulkDeleting={isBulkDeleting}
        />
      )}

      <ChatViewHeader
        chatTitle={chatTitle}
        chatSubtitle={chatSubtitle}
        type={type}
        conversation={conversation}
        channel={channel}
        onSearch={onSearch}
        onCall={onCall}
        onInfo={onInfo}
      />

      {ongoingCallBanner}

      <ChatMessageList
        messages={messages}
        type={type}
        chatId={chatId}
        currentMemberId={currentMemberId}
        membersToUse={membersToUse}
        isSelectionMode={isSelectionMode}
        selectedIds={selectedIds}
        tappedMessageId={tappedMessageId}
        bottomRef={bottomRef}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onToggleSelection={toggleSelection}
        onEnterSelectionMode={enterSelectionMode}
        onSetTappedMessageId={setTappedMessageId}
        onCancelSend={onCancelSend}
        onRetrySend={onRetrySend}
        onAddReaction={onAddReaction}
        onRemoveReaction={onRemoveReaction}
        onDeleteMessage={onDeleteMessage}
        onOpenThread={openThread}
      />

      <TypingIndicator typingUsers={typingUsers} />

      <div className="border-t border-border/70 bg-background px-4 py-3 sm:px-5">
        {composer}
      </div>
    </div>
  );
}
