import { cn } from "@/lib/utils";
import { AttachmentRenderer } from "../attachment-renderer";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import { MessageHoverActions } from "../message-hover-actions";
import { useThreadStore } from "@/lib/store/ui-stores";
import { Message } from "@/features/chat/types/messages/types";
import { TenantMember } from "@/features/chat/types/tenant-members/types";
import { getAvatarColor } from "@/lib/utils/avatar-colors";
import { PersonIcon } from "./icons";
import { MessageReactionsRenderer } from "./message-reactions";
import { formatTime, senderColor } from "./utils";
import { IconCheck } from "@tabler/icons-react";

interface ChatMessageItemProps {
  msg: Message;
  type: "channel" | "direct";
  chatId: string;
  currentMemberId?: string;
  membersToUse: TenantMember[];
  isSelectionMode: boolean;
  selectedIds: string[];
  tappedMessageId: string | null;
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

export function ChatMessageItem({
  msg,
  type,
  chatId,
  currentMemberId,
  membersToUse,
  isSelectionMode,
  selectedIds,
  tappedMessageId,
  onToggleSelection,
  onEnterSelectionMode,
  onSetTappedMessageId,
  onCancelSend,
  onRetrySend,
  onAddReaction,
  onRemoveReaction,
  onDeleteMessage,
  onOpenThread,
}: ChatMessageItemProps) {
  return (
    <div
      onClick={(e) => {
        if (isSelectionMode) {
          if (msg.sender.id === currentMemberId) {
            onToggleSelection(msg.id);
          }
          return;
        }
        if ((e.target as HTMLElement).closest('.actions-wrapper')) return;
        onSetTappedMessageId(prev => (prev === msg.id ? null : msg.id));
      }}
      className={cn(
        "flex gap-2.5 group relative px-2 py-1 hover:bg-sidebar-accent rounded-md cursor-pointer sm:cursor-default transition-colors",
        isSelectionMode && msg.sender.id === currentMemberId && "hover:bg-primary-button/10",
        selectedIds.includes(msg.id) && "bg-primary-button/10 hover:bg-primary-button/15"
      )}
    >
      {isSelectionMode && msg.sender.id === currentMemberId && (
        <div className="flex items-center justify-center shrink-0 w-6">
          <div className={cn(
            "w-4 h-4 rounded border flex items-center justify-center transition-colors",
            selectedIds.includes(msg.id)
              ? "bg-primary-button border-primary-button text-white"
              : "border-primary-button bg-background"
          )}>
            {selectedIds.includes(msg.id) && <IconCheck size={12} />}
          </div>
        </div>
      )}

      <button
        onClick={() => msg.sender.id && useThreadStore.getState().setProfileMember({
          id: msg.sender.id,
          firstName: msg.sender.firstName,
          lastName: msg.sender.lastName,
          avatar: msg.sender.avatar,
          userId: msg.sender.id,
        }) && useThreadStore.getState().setIsProfileOpen(true)}
        className="h-8 w-8 shrink-0 mt-0.5 rounded-md cursor-pointer"
      >
        <Avatar className="h-8 w-8 shrink-0 mt-0.5">
          <AvatarImage src={msg.sender.avatar!} alt={msg.sender.firstName} />
          <AvatarFallback
            rounded="md"
            className="flex items-center justify-center"
            style={{ backgroundColor: getAvatarColor(msg.sender?.id) }}
          >
            <PersonIcon />
          </AvatarFallback>
        </Avatar>
      </button>

      <div className="flex-1 min-w-0 space-y-[2px]">
        <div className="flex items-center gap-2">
          <span
            className="font-semibold text-sm leading-tight"
            style={{ color: senderColor(msg.sender?.id) }}
          >
            {msg.sender?.firstName} {msg.sender?.lastName}
          </span>
          <span className="text-[10px] text-muted-foreground/60">{formatTime(msg.createdAt)}</span>

          {msg.status === "sending" && (
            <>
              <span className="text-[10px] italic text-muted-foreground animate-pulse">Sending…</span>
              <button onClick={(e) => { e.stopPropagation(); onCancelSend(msg.id); }} className="text-[10px] text-destructive hover:underline relative z-10 cursor-pointer">Cancel</button>
            </>
          )}
          {msg.status === "failed" && (
            <button onClick={(e) => { e.stopPropagation(); onRetrySend(msg); }} className="text-[10px] text-destructive font-semibold hover:underline relative z-10 cursor-pointer">
              Failed · Retry
            </button>
          )}
        </div>

        <p className="text-sm leading-relaxed wrap-break-words text-foreground/90 whitespace-pre-wrap">
          {msg.content.split(/(@\[[^\]]+\]\([^)]+\))/g).map((part, i) => {
            if (part.startsWith("@[")) {
              const match = part.match(/@\[([^\]]+)\]\(([^)]+)\)/);
              if (match) {
                const name = match[1];
                const memberId = match[2];
                const matchingMember = membersToUse?.find((m: TenantMember) => String(m.id) === String(memberId));

                return (
                  <span key={i} className="inline-flex items-center gap-1.5 font-semibold text-primary-button bg-chat-primary-bg border border-border/40 shadow-sm rounded-md px-1.5 py-0.5 -ml-0.5 mr-0.5 align-middle transition-colors hover:border-primary-button/30">
                    <Avatar elevation="inner" className="h-4 w-4 shrink-0 -ml-0.5">
                      <AvatarImage src={matchingMember?.avatar || ""} />
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

        {msg.hasThreadedMessage && (
          <button
            onClick={(e) => { e.stopPropagation(); onOpenThread(msg); }}
            className="group/replies mt-1 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/8 border border-primary/15 hover:border-primary/30 transition-all relative z-10"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>
              {msg.threadCount ?? 0} {msg.threadCount === 1 ? "reply" : "replies"}
            </span>
            <span className="text-muted-foreground group-hover/replies:hidden">
              · Last {formatTime(msg.lastReplyTime)}
            </span>
            <span className="hidden group-hover/replies:inline text-muted-foreground">· View thread</span>
          </button>
        )}

        {msg.attachments && msg.attachments.length > 0 && (
          <div className="mt-1 relative z-10" onClick={(e) => e.stopPropagation()}>
            <AttachmentRenderer attachments={msg.attachments} />
          </div>
        )}

        <MessageReactionsRenderer
          msg={msg}
          type={type}
          chatId={chatId}
          currentMemberId={currentMemberId}
          onAddReaction={onAddReaction}
          onRemoveReaction={onRemoveReaction}
        />
      </div>

      <div className="actions-wrapper">
        <MessageHoverActions
          isVisible={tappedMessageId === msg.id}
          onReact={(emoji) => onAddReaction?.(msg.id, emoji)}
          onReply={() => onOpenThread(msg)}
          onSave={() => { }}
          onForward={() => { }}
          onMore={() => { }}
          onDelete={msg.sender.id === currentMemberId ? () => onDeleteMessage?.(msg.id) : undefined}
          onSelect={msg.sender.id === currentMemberId ? () => onEnterSelectionMode(msg.id) : undefined}
        />
      </div>
    </div>
  );
}
