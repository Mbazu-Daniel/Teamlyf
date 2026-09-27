import { MessageBubble } from "../message-bubble";
import { ThreadMessage } from "@/features/chat/types/thread-messages/types";
import { Message } from "@/features/chat/types/messages/types";

interface ThreadRepliesProps {
  isLoading: boolean;
  replies: ThreadMessage[];
  bottomRef: React.RefObject<HTMLDivElement | null>;
  onCancelSend: (id: string) => void;
  onRetrySend: (msg: Message | ThreadMessage) => void;
}

export function ThreadReplies({
  isLoading,
  replies,
  bottomRef,
  onCancelSend,
  onRetrySend,
}: ThreadRepliesProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 pt-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start gap-2.5 px-1">
            <div className="w-9 h-9 rounded-md bg-muted animate-pulse shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                <div className="h-2.5 w-12 bg-muted/60 rounded animate-pulse" />
              </div>
              <div className="h-3 w-full bg-muted/60 rounded animate-pulse" />
              {i % 2 === 0 && <div className="h-3 w-3/4 bg-muted/40 rounded animate-pulse" />}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (replies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 py-8 text-center">
        <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
          <svg
            className="w-5 h-5 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground/80">No replies yet</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Be the first to reply to this message.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {replies.map((msg: ThreadMessage, index: number) => {
        const prevMsg = replies[index - 1];
        const isSameSender = prevMsg && msg.sender?.id === prevMsg.sender?.id;
        const isRecent =
          prevMsg &&
          new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 300000;
        const compact = isSameSender && isRecent;

        return (
          <MessageBubble
            key={msg.id}
            message={msg}
            isCompact={compact}
            onCancelSend={onCancelSend}
            onRetrySend={onRetrySend}
          />
        );
      })}
      <div ref={bottomRef} className="h-2" />
    </>
  );
}
