import { IconAt, IconMessage, IconPhone, IconSettings } from "@tabler/icons-react";
import { NewChatModal } from "../new-chat-modals";
import CreateGroupSidebar from "../channels/create-group-sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getAvatarColor } from "@/lib/utils/avatar-colors";
import { QuickActionButton } from "./chat-sidebar-rail-parts";
import {
  ChannelsSection,
  DirectMessagesSection,
} from "./chat-sidebar-rail-sections";
import { useChatSidebarRail } from "./use-chat-sidebar-rail";

export function ChatSidebarRail() {
  const rail = useChatSidebarRail();

  return (
    <div className="flex h-full min-h-0 flex-col border-r border-border/60 bg-card/50">
      <div className="shrink-0 p-2 space-y-2">
        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-2.5 py-2 transition-all focus-within:border-primary/30 focus-within:ring-1 focus-within:ring-primary/20">
          <svg
            className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={rail.searchQuery}
            onChange={(e) => rail.setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/60"
          />
        </div>
        <div className="flex items-center gap-1">
          <QuickActionButton
            label="Threads"
            icon={IconMessage}
            active={rail.isActive("chat", "threads")}
            onClick={rail.handleOnThreadsClick}
            layout="sidebar"
          />
          <QuickActionButton
            label="Mentions"
            icon={IconAt}
            active={rail.isActive("chat", "mentions")}
            onClick={rail.handleOnMentionsClick}
            layout="sidebar"
          />
          <QuickActionButton
            label="Calls"
            icon={IconPhone}
            active={rail.isActive("chat", "calls")}
            onClick={rail.handleOnCallsClick}
            layout="sidebar"
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-1.5 space-y-4">
        <ChannelsSection
          channels={rail.filteredChannels}
          isLoading={rail.isLoading}
          searchQuery={rail.searchQuery}
          isOpen={rail.openGroups}
          onToggle={() => rail.setOpenGroups((v) => !v)}
          onAdd={() => rail.setOpenCreateGroup(true)}
          isActive={rail.isActive}
          onChannelClick={rail.handleOnChannelClick}
        />
        <DirectMessagesSection
          conversations={rail.filteredConversations}
          isLoading={rail.isLoading}
          searchQuery={rail.searchQuery}
          isOpen={rail.openDMs}
          onToggle={() => rail.setOpenDMs((v) => !v)}
          onAdd={() => rail.setOpenModal(true)}
          isActive={rail.isActive}
          onChatClick={rail.handleOnChatClick}
        />
      </div>

      <div className="shrink-0 border-t border-border/60 p-2">
        <button
          onClick={() =>
            rail.router.push(`/${rail.subdomain}/settings?section=profile`)
          }
          className="flex w-full items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-muted"
        >
          <Avatar rounded="md" className="h-7 w-7">
            <AvatarFallback
              rounded="md"
              tone="white"
              size="10px"
              weight="bold"
              style={{ background: getAvatarColor(rail.user?.id || "me") }}
            >
              {rail.user?.name
                ? rail.user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left min-w-0">
            <p className="truncate text-xs font-semibold text-foreground">
              {rail.user?.name || rail.user?.email || "User"}
            </p>
            <p className="truncate text-[10px] text-muted-foreground">
              {rail.user?.email}
            </p>
          </div>
          <IconSettings className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </div>

      <NewChatModal
        users={rail.members?.records || []}
        conversations={rail.conversations}
        onSelectUser={rail.handleSelectUser}
        open={rail.openModal}
        onOpenChange={rail.setOpenModal}
      />
      <CreateGroupSidebar
        users={rail.members?.records || []}
        open={rail.openCreateGroup}
        onClose={() => rail.setOpenCreateGroup(false)}
      />
    </div>
  );
}
