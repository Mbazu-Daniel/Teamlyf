import { useAppRouter } from "@/lib/navigation";
import { useTenantStore } from "@/lib/store/tenant-store";
import { ChatHeaderActions } from "../chat-header-actions";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import { DirectMessagePreview } from "@/features/chat/types/conversation/types";
import { Channel } from "@/features/chat/types/channel/types";
import { getAvatarColor } from "@/lib/utils/avatar-colors";
import { PersonIcon } from "./icons";
import { fmt } from "./utils";
import { IconChevronLeft } from "@tabler/icons-react";

interface ChatViewHeaderProps {
  chatTitle?: string;
  chatSubtitle?: string;
  type: "channel" | "direct";
  conversation?: DirectMessagePreview;
  channel?: Channel;
  onSearch?: () => void;
  onCall?: () => void;
  onInfo?: () => void;
}

export function ChatViewHeader({
  chatTitle,
  chatSubtitle,
  type,
  conversation,
  channel,
  onSearch,
  onCall,
  onInfo,
}: ChatViewHeaderProps) {
  const router = useAppRouter();
  const subdomain = useTenantStore((state) => state.subdomain);

  return (
    <div className="z-10 flex h-16 shrink-0 items-center gap-3 border-b border-border/70 bg-background px-4 sm:px-5">
      <button
        className="rounded-[8px] p-2 transition hover:bg-muted md:hidden"
        onClick={() => router.push(`/${subdomain}/chats`)}
      >
        <IconChevronLeft className="h-5 w-5" />
      </button>

      <Avatar className="h-9 w-9 shrink-0">
        <AvatarImage src={conversation?.otherMember?.avatar || channel?.avatar} alt={chatTitle} />
        <AvatarFallback
          rounded="md"
          className="flex items-center justify-center"
          style={{ backgroundColor: getAvatarColor(conversation?.otherMember?.id || channel?.id || "default") }}
        >
          {type === "channel"
            ? <span className="text-white font-bold text-xs">#</span>
            : <PersonIcon />
          }
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold leading-tight tracking-[-0.01em]">
          {fmt(chatTitle)}
        </p>
        {chatSubtitle && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground leading-tight">{chatSubtitle}</p>
        )}
      </div>

      <ChatHeaderActions onSearch={onSearch} onCall={onCall} onInfo={onInfo} />
    </div>
  );
}
