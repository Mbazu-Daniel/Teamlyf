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
    <div className="border-b px-3 sm:px-4 h-14 flex items-center gap-3 shrink-0 shadow-sm bg-background z-10">
      <button
        className="p-1.5 hover:bg-muted rounded-md md:hidden"
        onClick={() => router.push(`/${subdomain}/chats`)}
      >
        <IconChevronLeft className="h-5 w-5" />
      </button>

      <Avatar className="h-8 w-8 shrink-0">
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
        <p className="font-semibold text-sm truncate leading-tight">
          {fmt(chatTitle)}
        </p>
        {chatSubtitle && (
          <p className="text-xs text-muted-foreground truncate leading-tight">{chatSubtitle}</p>
        )}
      </div>

      <ChatHeaderActions onSearch={onSearch} onCall={onCall} onInfo={onInfo} />
    </div>
  );
}
