import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AttachmentRenderer } from "./attachment-renderer";
import { TenantMember } from "@/features/chat/types/tenant-members/types";
import { Message } from "@/features/chat/types/messages/types";
import { ThreadMessage } from "@/features/chat/types/thread-messages/types";
import { useTenantStore } from "@/lib/store/tenant-store";
import { useFetchTenantMembers } from "@/features/chat/data/queries/use-fetch-tenant-members-hook";
import { getAvatarColor } from "@/lib/utils/avatar-colors";

interface MessageBubbleProps {
  message: Message | ThreadMessage;
  showAvatar?: boolean;
  showActions?: boolean;
  onReply?: (message: Message | ThreadMessage) => void;
  onCancelSend?: (tempId: string) => void;
  onRetrySend?: (msg: Message | ThreadMessage) => void;
  isCompact?: boolean;
  onAvatarClick?: (memberId: string) => void;
}

const senderColors = [
  "#7C3AED",
  "#2563EB",
  "#059669",
  "#E11D48",
  "#D97706",
  "#0891B2",
  "#DB2777",
  "#4F46E5",
  "#0D9488",
  "#DC2626",
  "#16A34A",
  "#EA580C",
  "#9333EA",
  "#0284C7",
  "#BE185D",
];
// ... (colors and senderColors arrays stay exactly the same)

export function MessageBubble({
  message,
  showAvatar = true,
  showActions = true,
  onCancelSend,
  onRetrySend,
  onReply,
  isCompact = false,
  onAvatarClick,
}: MessageBubbleProps) {
  const sender = message.sender;
  const name = `${sender?.firstName ?? ""} ${sender?.lastName ?? ""}`;

  const getSenderColor = (id: string) => {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
    return senderColors[Math.abs(h) % senderColors.length];
  };

  const { tenantId } = useTenantStore();
  const { data: tenantMembers } = useFetchTenantMembers(tenantId ?? "");
  const membersToUse = tenantMembers?.records || [];

  const isSending = message.status === "sending";
  const isFailed = message.status === "failed";

  return (
    <div className={`group flex hover:bg-sidebar-accent rounded-md px-2 gap-2 relative ${isCompact ? "py-1" : "pt-1"}`}>
      {/* If compact, we show an empty div of the same width as the Avatar to maintain alignment */}
      {showAvatar && (
        isCompact ? (
          <div className="w-8 shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="text-[10px] text-muted">
              {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ) : (
          <button
            onClick={() => sender?.id && onAvatarClick?.(sender.id)}
            className="h-8 w-8 shrink-0 rounded-md cursor-pointer"
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={sender?.avatar || "default"} alt={`${sender?.firstName} ${sender?.lastName} avatar`} />
              <AvatarFallback
                style={{ backgroundColor: getAvatarColor(sender.id) }}
                rounded="md"
                className="flex items-center justify-center"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white/90">
                  <circle cx="12" cy="8" r="3.5" />
                  <path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
                </svg>
              </AvatarFallback>
            </Avatar>
          </button>
        )
      )}

      <div className="flex-1 pb-1">
        {/* Header - Only show if NOT compact */}
        {!isCompact && (
          <div className="flex items-center gap-3 text-xs mb-1">
            <span
              className="font-bold text-sm"
              style={{ color: getSenderColor(sender.id) }}
            >
              {name}
            </span>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground bg-muted-foreground w-1 h-1 rounded-full"> </span>
              <span className="text-muted-foreground">
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {isSending && (
              <>
                <span className="italic animate-pulse">
                  Sending...
                </span>

                <button
                  onClick={() => onCancelSend?.(message.id)}
                  className="text-destructive"
                  aria-label="Cancel sending message"
                >
                  Cancel
                </button>
              </>
            )}

            {isFailed && (
              <button
                onClick={() => onRetrySend?.(message)}
                className="text-destructive"
                aria-label="Retry sending message"
              >
                Retry
              </button>
            )}

            {showActions && onReply && (
              <button
                onClick={() => onReply(message)}
                className="ml-2 hidden group-hover:inline text-xs text-primary hover:underline"
                aria-label="Reply to message"
              >
                Reply
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div>
          <p className="text-sm leading-relaxed wrap-break-words text-foreground/90 whitespace-pre-wrap">
            {message.content.split(/(@\[[^\]]+\]\([^)]+\))/g).map((part, i) => {
              if (part.startsWith("@[")) {
                const match = part.match(/@\[([^\]]+)\]\(([^)]+)\)/);
                if (match) {
                  const name = match[1];
                  const memberId = match[2];
                  const matchingMember = membersToUse?.find((m: TenantMember) => String(m.id) === String(memberId));

                  return (
                    <span key={i} className="inline-flex items-center gap-1.5 font-semibold text-primary-button bg-chat-primary-bg border border-border/40 shadow-sm rounded-md px-1.5 py-0.5 -ml-0.5 mr-0.5 align-middle transition-colors hover:border-primary-button/30">
                      <Avatar elevation="inner" className="h-4 w-4 shrink-0 -ml-0.5">
                        <AvatarImage src={matchingMember?.avatar || undefined} alt={`${matchingMember?.firstName} ${matchingMember?.lastName} avatar`} />
                        <AvatarFallback
                          size="7px"
                          tone="white"
                          weight="bold"
                          style={{ backgroundColor: getAvatarColor(memberId) }}
                        >
                          {name[0]}
                        </AvatarFallback>
                      </Avatar>
                      @{name}
                    </span>
                  );
                }
              }
              return <span key={i}>{part}</span>;
            })}
          </p>

          {isCompact && isSending && (
            <>
              <span className="italic animate-pulse">
                sending...
              </span>

              <button
                onClick={() => onCancelSend?.(message.id)}
                className="text-destructive"
                aria-label="Cancel sending message"
              >
                Cancel
              </button>
            </>
          )}

          {isCompact && isFailed && (
            <button
              onClick={() => onRetrySend?.(message)}
              className="text-destructive"
              aria-label="Retry sending message"
            >
              Retry
            </button>
          )}
        </div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2">
            <AttachmentRenderer attachments={message.attachments} />
          </div>
        )}

        {/* Thread metadata */}
        {message.threadCount! > 0 && (
          <button
            onClick={() => onReply?.(message)}
            className="text-xs text-primary hover:underline mt-1 block cursor-pointer"
            aria-label={`View ${message.threadCount} replies`}
          >
            {message.threadCount} replies
          </button>
        )}
      </div>
    </div>
  );
}