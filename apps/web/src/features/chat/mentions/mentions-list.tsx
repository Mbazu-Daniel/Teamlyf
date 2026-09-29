import { PageEmptyState } from "@/components/workspace/page-layout";
import { IconAt, IconChevronRight, IconClock, IconHash, IconMessageQuestion } from "@tabler/icons-react";
import { useAppRouter } from "@/lib/navigation";


import { useMemo, useState } from "react";

import { useFetchMentions } from "@/features/chat/data/queries/use-fetch-mentions-hook";
import type { MessageMentionRecord } from "@/features/chat/data/chat-api";
import { useTenantStore } from "@/lib/store/tenant-store";
import { useGetCurrentUser } from "@/features/chat/data/queries/use-get-current-user-hook";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Message } from "@/features/chat/types/messages/types";
import { getAvatarColor } from "@/lib/utils/avatar-colors";

function mapMentionToMessage(mention: MessageMentionRecord, currentMemberId: string): Message | null {
  const channelMsg = mention.channelMessage;
  const directMsg = mention.directMessage;
  const mentionedBy = mention.mentionedBy;
  if (!mentionedBy?.id) return null;

  const partnerId =
    directMsg && currentMemberId
      ? directMsg.senderId === currentMemberId
        ? directMsg.recipientId
        : directMsg.senderId
      : undefined;

  return {
    id: mention.messageId || mention.id,
    type: mention.messageType,
    content: channelMsg?.content || directMsg?.content || "",
    createdAt: mention.createdAt,
    channelId: channelMsg?.channelId,
    conversationId: partnerId,
    channel: channelMsg?.channel
      ? { id: channelMsg.channel.id, name: channelMsg.channel.name ?? "channel" }
      : undefined,
    conversation: partnerId
      ? {
          id: partnerId,
          otherMember: {
            id: partnerId,
            firstName: "",
            lastName: "",
            avatar: null,
          },
        }
      : undefined,
    sender: {
      id: mentionedBy.id,
      firstName: mentionedBy.firstName ?? "",
      lastName: mentionedBy.lastName ?? "",
      preferredName: mentionedBy.preferredName,
      avatar: mentionedBy.avatar ?? null,
    },
    isCurrentUserMessage: false,
    isRead: false,
  };
}

export function MentionsList() {
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const { tenantId } = useTenantStore();
  const { data: user } = useGetCurrentUser(tenantId);
  const memberId = user?.id ?? null;
  const { data: mentionsRaw, isLoading } = useFetchMentions(tenantId, memberId);

  const allMentions = useMemo(
    () =>
      (mentionsRaw ?? [])
        .map((m) => (memberId ? mapMentionToMessage(m, memberId) : null))
        .filter((m): m is Message => m !== null),
    [mentionsRaw, memberId],
  );
  const unreadMentions = allMentions.filter((m) => !m.isRead);
  const mentions = activeTab === "all" ? allMentions : unreadMentions;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, "h:mm a");
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM d");
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-card">
      <div className="border-b border-border/70 bg-card px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-button/10 rounded-xl flex items-center justify-center">
              <IconAt className="w-5 h-5 text-primary-button" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Mentions</h2>
              <p className="text-xs text-muted-foreground">See where people have mentioned you</p>
            </div>
          </div>

          <div className="ml-auto flex h-control items-center gap-1 rounded-[12px] bg-muted/60 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={cn(
                "inline-flex h-control-inner items-center rounded-[9px] px-4 text-[13px] font-medium transition-colors",
                activeTab === "all"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("unread")}
              className={cn(
                "inline-flex h-control-inner items-center rounded-[9px] px-4 text-[13px] font-medium transition-colors",
                activeTab === "unread"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Unread
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-border/30">
                <Skeleton variant="full" className="h-10 w-10 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="rounded" className="h-4 w-48" />
                  <Skeleton variant="rounded" className="h-3 w-32" />
                </div>
                <Skeleton variant="full" className="h-8 w-8" />
              </div>
            ))}
          </div>
        ) : mentions.length === 0 ? (
          <div className="p-4 sm:p-6"><PageEmptyState icon={IconAt} title="No mentions found" description={activeTab === "all" ? "When someone mentions you in a channel or direct message, you can find it here." : "You are up to date. New mentions will appear here."} /></div>
        ) : (
          <div className="divide-y divide-border/30">
            {mentions.map((mention: Message) => (
              <MentionListItem key={mention.id} mention={mention} formatDate={formatDate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MentionListItem({
  mention,
  formatDate,
}: {
  mention: Message;
  formatDate: (d: string) => string;
}) {
  const router = useAppRouter();
  const sender = mention.sender;
  const displayName = sender
    ? sender.preferredName || `${sender.firstName} ${sender.lastName}`.trim()
    : "Unknown";
  const displayPhoto = sender?.avatar || "";
  const initial = (sender?.preferredName?.[0] || sender?.firstName?.[0] || "?").toUpperCase();

  const handleNavigation = () => {
    if (mention.type === "channel" && mention.channel?.id) {
      router.push(`/chats/channel/${mention.channel.id}?messageId=${mention.id}`);
    } else if (mention.type === "direct" && mention.conversation?.id) {
      router.push(`/chats/dm/${mention.conversation.id}?messageId=${mention.id}`);
    } else if (mention.channelId) {
      router.push(`/chats/channel/${mention.channelId}?messageId=${mention.id}`);
    } else if (mention.conversationId) {
      router.push(`/chats/dm/${mention.conversationId}?messageId=${mention.id}`);
    }
  };

  return (
    <div
      onClick={handleNavigation}
      className="px-6 py-4 hover:bg-card/40 transition-colors group cursor-pointer"
    >
      <div className="flex items-start gap-4">
        <Avatar border="subtle" className="h-10 w-10 shrink-0 mt-1">
          <AvatarImage src={displayPhoto} />
          <AvatarFallback
            tone="white"
            weight="bold"
            className="flex items-center justify-center"
            style={{ backgroundColor: getAvatarColor(sender?.id || mention.id) }}
          >
            {initial}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-foreground">
              {displayName}
              <span className="ml-2 text-xs font-normal text-muted-foreground font-sans">
                mentioned you
              </span>
            </p>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {formatDate(mention.createdAt)}
            </span>
          </div>

          <div className="mt-1 p-2 bg-card/50 rounded-lg border border-border/30">
            <p className="text-xs text-foreground line-clamp-2 italic">
              &quot;{mention.content || "Shared an attachment"}&quot;
            </p>
          </div>

          <div className="flex items-center gap-3 mt-2">
            {mention.channel?.name ? (
              <div className="flex items-center gap-1.5 text-primary-button bg-primary-button/10 px-2 py-0.5 rounded-full">
                <IconHash className="w-3 h-3" />
                <span className="text-[10px] font-bold">#{mention.channel.name}</span>
              </div>
            ) : mention.channelId ? (
              <div className="flex items-center gap-1.5 text-primary-button bg-primary-button/10 px-2 py-0.5 rounded-full">
                <IconHash className="w-3 h-3" />
                <span className="text-[10px] font-bold">#channel</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/20 px-2 py-0.5 rounded-full">
                <IconMessageQuestion className="w-3 h-3" />
                <span className="text-[10px] font-bold font-sans">Direct Message</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <IconClock className="w-3 h-3" />
              <span className="text-[10px]">{formatDate(mention.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
          <IconChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
