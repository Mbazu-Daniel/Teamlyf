import React, { useEffect, useState, lazy, Suspense } from "react";
import { ChatView } from "../chat-view";
import { useChannelChatData } from "./use-channel-chat-data";
import { useChannelCall } from "./use-channel-call";
import { useChannelMessageActions } from "./use-channel-message-actions";
import { OngoingCallBanner } from "./ongoing-call-banner";
import { CallConnectingOverlay } from "./call-connecting-overlay";
import { ChannelJoinScreen } from "./channel-join-screen";

const ChatComposer = lazy(() =>
  import("../chat-composer").then((m) => ({ default: m.ChatComposer })),
);

export function ChannelChatContent({ channelId }: { channelId: string }) {
  const [message, setMessage] = useState("");

  const {
    bottomRef,
    tenantId,
    subdomain,
    accessToken,
    channel,
    messages,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    myMemberId,
    channelMembers,
    typingUsers,
    typingUserNames,
    typing,
    joinChannel,
    isJoining,
    addReaction,
    removeReaction,
  } = useChannelChatData(channelId);

  const {
    isConnecting,
    activeCallSession,
    isCallOngoing,
    handleJoinOngoingCall,
    handleInitiateCall,
    handleCancelConnecting,
    setActiveCallSession,
  } = useChannelCall({
    channelId,
    tenantId: tenantId!,
    accessToken: accessToken!,
    myMemberId,
    channelMembers,
  });

  const {
    isBulkDeleting,
    handleSend,
    cancelSending,
    retrySend,
    handleDeleteMessage,
    handleBulkDelete,
  } = useChannelMessageActions({
    tenantId: tenantId!,
    channelId,
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
  }, [messages, typingUsers, isConnecting, bottomRef]);

  return (
    <div className="relative h-full w-full">
      {isConnecting && (
        <CallConnectingOverlay channel={channel} onCancel={handleCancelConnecting} />
      )}

      {channel && channel.isMember === false ? (
        <ChannelJoinScreen
          channel={channel}
          subdomain={subdomain}
          isJoining={isJoining}
          onJoin={joinChannel}
        />
      ) : (
        <ChatView
          chatTitle={`${channel?.name}`}
          chatSubtitle={channel?.description || "Channel"}
          messages={messages}
          channel={channel}
          type="channel"
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
                channelId={channelId}
                type="channel"
              />
            </Suspense>
          }
          chatId={channelId}
          currentMemberId={myMemberId}
          onAddReaction={addReaction}
          onRemoveReaction={removeReaction}
          onDeleteMessage={handleDeleteMessage}
          onBulkDelete={handleBulkDelete}
          isBulkDeleting={isBulkDeleting}
          onCall={activeCallSession ? undefined : () => handleInitiateCall("voice")}
          ongoingCallBanner={
            isCallOngoing ? (
              <OngoingCallBanner
                type={activeCallSession!.callType || "voice"}
                onJoin={handleJoinOngoingCall}
                onDecline={() => setActiveCallSession(null)}
              />
            ) : null
          }
          hasNextPage={hasNextPage}
          fetchNextPage={fetchNextPage}
          isFetchingNextPage={isFetchingNextPage}
        />
      )}
    </div>
  );
}
