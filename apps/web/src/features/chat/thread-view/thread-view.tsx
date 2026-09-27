import { MessageBubble } from "../message-bubble";
import { ThreadComposer } from "../thread-composer";
import { Button } from "../../../components/ui/button";
import { ThreadReplies } from "./thread-replies";
import { useThreadView, ThreadViewProps } from "./use-thread-view";
import { IconX } from "@tabler/icons-react";

export function ThreadView({ parentMessage, event, chatId }: ThreadViewProps) {
  const {
    message,
    setMessage,
    tenantId,
    bottomRef,
    liveParentMessage,
    replies,
    isLoading,
    typing,
    closeThread,
    handleSend,
    cancelSending,
    retrySend,
    getTargetPayload,
  } = useThreadView({ parentMessage, event, chatId });

  return (
    <div className="flex h-full flex-col bg-chat-primary-bg">
      <div className="flex items-center justify-between px-4 h-14 border-b shrink-0 bg-chat-primary-bg">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-primary-button/15 flex items-center justify-center">
            <svg
              className="w-3.5 h-3.5 text-primary-button"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span className="font-semibold text-sm text-foreground">Thread</span>
          {replies.length > 0 && (
            <span className="text-caption-xs font-bold bg-primary-button/15 text-primary-button px-1.5 py-0.5 rounded-full">
              {replies.length}
            </span>
          )}
        </div>

        <Button
          variant="ghost-primary"
          size="icon"
          className="hidden md:flex h-7 w-7"
          onClick={closeThread}
        >
          <IconX className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="px-3 pt-3 pb-2 shrink-0">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
          Original message
        </p>
        <div className="border-l-2 border-primary-button bg-primary-button/5 rounded-r-md px-3 py-1">
          <MessageBubble message={liveParentMessage} />
        </div>
      </div>

      {replies.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 shrink-0">
          <div className="flex-1 h-px bg-border" />
          <span className="text-caption-xs text-muted-foreground font-medium whitespace-nowrap">
            {replies.length} {replies.length === 1 ? "reply" : "replies"}
            {" · "}
            <span className="text-muted-foreground/70">
              Last{" "}
              {new Date(replies[replies.length - 1].createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 py-1">
        <ThreadReplies
          isLoading={isLoading}
          replies={replies}
          bottomRef={bottomRef}
          onCancelSend={cancelSending}
          onRetrySend={retrySend}
        />
      </div>

      <div className="shrink-0 border-t bg-chat-primary-bg">
        <ThreadComposer
          value={message}
          onChange={setMessage}
          onSend={handleSend}
          tenantId={tenantId!}
          {...getTargetPayload()}
          onTyping={typing.start}
          type={event}
        />
      </div>
    </div>
  );
}
