import { PageEmptyState } from "@/components/workspace/page-layout";
import { useAppRouter } from "@/lib/navigation";

import { useState } from "react";
import { useFetchThreads } from "@/features/chat/data/queries/use-fetch-threads-hook";
import { useTenantStore } from "@/lib/store/tenant-store";
import { useThreadStore } from "@/lib/store/ui-stores";
import { useIsMobile } from "@/hooks/use-mobile";
import { getAvatarColor } from "@/lib/utils/avatar-colors";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Message } from "@/features/chat/types/messages/types";
import { IconMessage, IconClock, IconMessageQuestion, IconChevronRight } from "@tabler/icons-react";

export function ThreadsList() {
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const isMobile = useIsMobile();
  const setIsChatSidebarOpen = useThreadStore((state) => state.setIsChatSidebarOpen);
  const { tenantId, subdomain } = useTenantStore();
  const { data: threadsData, isLoading } = useFetchThreads(tenantId!);

  const allThreads = threadsData?.records || [];
  const unreadThreads = allThreads.filter((t) => (t.threadCount || 0) > 0);

  const threads = activeTab === "all" ? allThreads : unreadThreads;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, "h:mm a");
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM d");
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-card">
      {/* Header */}
      <div className="border-b border-border/70 bg-card px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-button/10 rounded-xl flex items-center justify-center">
              <IconMessage className="w-5 h-5 text-primary-button" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Threads</h2>
              <p className="text-xs text-muted-foreground">
                Keep track of your conversations per thread
              </p>
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

      {/* Content */}
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
        ) : threads.length === 0 ? (
          <div className="p-4 sm:p-6">
            <PageEmptyState
              icon={IconMessage}
              title="No threads found"
              description={
                activeTab === "all"
                  ? "Reply to a message to start a thread. Your conversations will stay together here."
                  : "You are up to date. Unread thread replies will appear here."
              }
            />
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {threads.map((thread: Message) => (
              <ThreadListItem
                key={thread.id}
                thread={thread}
                formatDate={formatDate}
                subdomain={subdomain!}
                onNavigate={() => {
                  if (isMobile) {
                    setIsChatSidebarOpen(false);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ThreadListItem({
  thread,
  formatDate,
  subdomain,
  onNavigate,
}: {
  thread: Message;
  formatDate: (d: string) => string;
  subdomain: string;
  onNavigate: () => void;
}) {
  const router = useAppRouter();
  const sender = thread.sender;
  const displayName = sender
    ? sender.preferredName || `${sender.firstName} ${sender.lastName}`
    : "Unknown";
  const displayPhoto = sender?.avatar || "";
  const initial = (sender?.preferredName?.[0] || sender?.firstName?.[0] || "?").toUpperCase();

  const handleNavigation = () => {
    onNavigate();

    if (thread.type === "channel" && thread.channel?.id) {
      router.push(`/${subdomain}/chats/channel/${thread.channel.id}?threadId=${thread.id}`);
    } else if (thread.type === "direct" && thread.conversation?.id) {
      router.push(`/${subdomain}/chats/dm/${thread.conversation.id}?threadId=${thread.id}`);
    } else if (thread.channelId) {
      router.push(`/${subdomain}/chats/channel/${thread.channelId}?threadId=${thread.id}`);
    } else if (thread.conversationId) {
      router.push(`/${subdomain}/chats/dm/${thread.conversationId}?threadId=${thread.id}`);
    }
  };

  return (
    <div
      onClick={handleNavigation}
      className="px-6 py-4 hover:bg-chat-primary-bg transition-colors group cursor-pointer"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Avatar border="subtle" className="h-10 w-10 shrink-0 mt-1">
          <AvatarImage src={displayPhoto} />
          <AvatarFallback
            tone="white"
            weight="bold"
            className="flex items-center justify-center"
            style={{ backgroundColor: getAvatarColor(sender?.id || thread.id) }}
          >
            {initial}
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-foreground truncate">
              {thread.content ||
                (thread.attachments?.length ? "Shared an attachment" : "Threaded conversation")}
            </p>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {formatDate(thread.lastReplyTime || thread.createdAt)}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-muted-foreground truncate max-w-[80%]">
              By <span className="font-semibold">{displayName}</span>
            </p>
            {thread.channel?.name && (
              <span className="text-[10px] px-1.5 py-0.5 bg-primary-button/10 text-primary-button rounded font-bold">
                #{thread.channel.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1.5 text-primary-button bg-primary-button/10 px-2 py-0.5 rounded-full">
              <IconMessageQuestion className="w-3 h-3" />
              <span className="text-[10px] font-bold">{thread.threadCount || 0} replies</span>
            </div>
            {thread.lastReplyTime && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <IconClock className="w-3 h-3" />
                <span className="text-[10px]">Active {formatDate(thread.lastReplyTime)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Arrow */}
        <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
          <IconChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
