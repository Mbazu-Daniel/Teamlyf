import React, { useEffect, useState, lazy, Suspense } from "react";
import { ChatView } from "../chat-view";
import { useDirectChatData } from "./use-direct-chat-data";
import { useDirectCall } from "./use-direct-call";
import { useDirectMessageActions } from "./use-direct-message-actions";
import { DirectCallConnectingOverlay } from "./direct-call-connecting-overlay";

const ChatComposer = lazy(() =>
  import("../chat-composer").then((m) => ({ default: m.ChatComposer })),
);

export function DirectChatContent({ chatId }: { chatId: string }) {
  const [message, setMessage] = useState("");

  const {
    bottomRef,
    tenantId,
    accessToken,
    conversation,
    messages,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    myMemberId,
    typingUserNames,
    typing,
    addReaction,
    removeReaction,
  } = useDirectChatData(chatId);

  const { isConnecting, handleInitiateCall, handleCancelConnecting } = useDirectCall({
    chatId,
    tenantId: tenantId!,
    accessToken: accessToken!,
  });

  const {
    isBulkDeleting,
    handleSend,
    cancelSending,
    retrySend,
    handleDeleteMessage,
    handleBulkDelete,
  } = useDirectMessageActions({
    tenantId: tenantId!,
    chatId,
    accessToken: accessToken!,
    myMemberId,
    message,
    setMessage,
    typing,
  });

  useEffect(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [messages, typingUserNames, isConnecting, bottomRef]);

  return (
    <div className="relative h-full w-full">
      {isConnecting && (
        <DirectCallConnectingOverlay
          conversation={conversation}
          onCancel={handleCancelConnecting}
        />
      )}

      <ChatView
        chatTitle={`${conversation?.otherMember.firstName} ${conversation?.otherMember.lastName}`}
        conversation={conversation}
        chatSubtitle={conversation?.otherMember.isOnline ? "Online" : "Offline"}
        messages={messages}
        type="direct"
        isLoading={isLoading}
        typingUsers={typingUserNames}
        onCancelSend={cancelSending}
        onRetrySend={retrySend}
        bottomRef={bottomRef as React.RefObject<HTMLDivElement>}
        composer={
          <Suspense fallback={null}>
            <ChatComposer
              value={message}
              onChange={setMessage}
              onSend={handleSend}
              onTyping={typing.start}
              tenantId={tenantId!}
              conversationId={chatId}
              type="direct"
            />
          </Suspense>
        }
        chatId={chatId}
        currentMemberId={myMemberId}
        onAddReaction={addReaction}
        onRemoveReaction={removeReaction}
        onDeleteMessage={handleDeleteMessage}
        onBulkDelete={handleBulkDelete}
        isBulkDeleting={isBulkDeleting}
        onCall={() => handleInitiateCall("voice")}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />
    </div>
  );
}
