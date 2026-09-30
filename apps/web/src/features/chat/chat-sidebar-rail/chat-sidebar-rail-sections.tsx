import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Channel } from "@/features/chat/types/channel/types";
import { DirectMessagePreview } from "@/features/chat/types/conversation/types";
import { getAvatarColor } from "@/lib/utils/avatar-colors";
import { useThreadStore } from "@/lib/store/ui-stores";
import { cn } from "@/lib/utils";
import { Section, SidebarSkeleton, PersonIcon, fmt } from "./chat-sidebar-rail-parts";

interface ChannelsSectionProps {
  channels: Channel[];
  isLoading: boolean;
  searchQuery: string;
  isOpen: boolean;
  onToggle: () => void;
  onAdd: () => void;
  isActive: (type: "channel", id: string) => boolean;
  onChannelClick: (channelId: string) => void;
}

export function ChannelsSection({
  channels,
  isLoading,
  searchQuery,
  isOpen,
  onToggle,
  onAdd,
  isActive,
  onChannelClick,
}: ChannelsSectionProps) {
  return (
    <Section
      title="Channels"
      count={channels.length}
      isOpen={isOpen}
      onToggle={onToggle}
      onAdd={onAdd}
    >
      {isLoading ? (
        <SidebarSkeleton />
      ) : channels.length === 0 ? (
        <p className="px-2 py-2 text-center text-[11px] text-muted-foreground">
          {searchQuery ? "No matching channels" : "No channels yet"}
        </p>
      ) : (
        channels.map((item: Channel) => (
          <button
            key={item.id}
            onClick={() => onChannelClick(item.id)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-[13px] transition-colors",
              isActive("channel", item.id)
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
            )}
          >
            <div
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
              style={{ backgroundColor: getAvatarColor(item.id) }}
            >
              #
            </div>
            <span className="flex-1 truncate">{fmt(item.name)}</span>
            {item.unreadCount > 0 && (
              <span className="min-w-[18px] shrink-0 rounded-full bg-destructive px-1 py-0.5 text-center text-[10px] font-bold text-white">
                {item.unreadCount}
              </span>
            )}
          </button>
        ))
      )}
    </Section>
  );
}

interface DirectMessagesSectionProps {
  conversations: DirectMessagePreview[];
  isLoading: boolean;
  searchQuery: string;
  isOpen: boolean;
  onToggle: () => void;
  onAdd: () => void;
  isActive: (type: "chat", id: string) => boolean;
  onChatClick: (chatId: string) => void;
}

export function DirectMessagesSection({
  conversations,
  isLoading,
  searchQuery,
  isOpen,
  onToggle,
  onAdd,
  isActive,
  onChatClick,
}: DirectMessagesSectionProps) {
  return (
    <Section
      title="Direct Messages"
      count={conversations.length}
      isOpen={isOpen}
      onToggle={onToggle}
      onAdd={onAdd}
    >
      {isLoading ? (
        <SidebarSkeleton />
      ) : conversations.length === 0 ? (
        <p className="px-2 py-2 text-center text-[11px] text-muted-foreground">
          {searchQuery ? "No matching people" : "No conversations yet"}
        </p>
      ) : (
        conversations.map((item: DirectMessagePreview) => {
          const member = item.otherMember;
          return (
            <button
              key={item.id}
              onClick={() => {
                onChatClick(item.otherMember.id);
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-[13px] transition-colors",
                isActive("chat", item.otherMember.id)
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              <div
                className="relative shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  useThreadStore.getState().setProfileMember({
                    id: member.id,
                    firstName: member.firstName,
                    lastName: member.lastName,
                    avatar: member.avatar,
                  });
                  useThreadStore.getState().setIsProfileOpen(true);
                }}
              >
                <Avatar className="h-5 w-5">
                  <AvatarImage src={item.otherMember?.avatar ?? ""} />
                  <AvatarFallback
                    rounded="md"
                    size="9px"
                    className="flex items-center justify-center"
                    style={{
                      backgroundColor: getAvatarColor(item.otherMember?.id ?? ""),
                    }}
                  >
                    <PersonIcon className="w-2.5 h-2.5" />
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 ring-1 ring-background" />
              </div>
              <span className="flex-1 truncate">
                {[fmt(item.otherMember.firstName), fmt(item.otherMember.lastName)]
                  .filter(Boolean)
                  .join(" ")}
              </span>
              {item.unreadCount > 0 && (
                <span className="min-w-[18px] shrink-0 rounded-full bg-destructive px-1 py-0.5 text-center text-[10px] font-bold text-white">
                  {item.unreadCount}
                </span>
              )}
            </button>
          );
        })
      )}
    </Section>
  );
}
