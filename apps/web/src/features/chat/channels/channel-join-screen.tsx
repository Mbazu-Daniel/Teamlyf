import { IconCalendar, IconChevronLeft, IconChevronRight, IconHash, IconUser } from "@tabler/icons-react";
import { useAppRouter } from "@/lib/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Channel } from "@/features/chat/types/channel/types";
import { useIsMobile } from "@/hooks/use-mobile";

type ChannelJoinScreenProps = {
  channel: Channel;
  subdomain: string | null;
  isJoining: boolean;
  onJoin: (channelId: string) => void;
};

export function ChannelJoinScreen({
  channel,
  subdomain,
  isJoining,
  onJoin,
}: ChannelJoinScreenProps) {
  const isMobile = useIsMobile();
  const router = useAppRouter();

  return (
    <div className="flex h-full w-full flex-col bg-chat-primary-bg overflow-hidden relative">
      {isMobile && (
        <div className="flex items-center gap-3 px-4 h-14 border-b bg-background shrink-0">
          <button
            onClick={() => router.push(`/${subdomain}/chats`)}
            className="p-1 -ml-2 rounded-full hover:bg-muted/50 transition-colors"
          >
            <IconChevronLeft size={22} className="text-muted-foreground" />
          </button>
          <h1 className="text-sm font-bold flex items-center gap-1.5 truncate">
            <IconHash size={16} className="text-muted-foreground" />
            {channel.name}
          </h1>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-lg space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-col items-center text-center space-y-5">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition-opacity duration-500" />
              <Avatar
                className="h-32 w-32 relative"
                border="background-lg"
                elevation="2xl"
                rounded="2.2rem"
              >
                <AvatarImage src={channel.avatar || undefined} />
                <AvatarFallback
                  size="5xl"
                  weight="black"
                  bg="blue-indigo-gradient"
                  tone="white"
                  rounded="2.2rem"
                >
                  {channel.name[0]?.toUpperCase() || "#"}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="space-y-2 px-4 max-w-sm mx-auto">
              <h2 className="text-4xl font-extrabold tracking-tight text-foreground flex items-center justify-center gap-2">
                <span className="text-blue-500 text-3xl font-black opacity-90">#</span>
                {channel.name}
              </h2>
              <p className="text-base text-muted-foreground font-medium leading-normal">
                {channel.description || "Welcome to the group! This channel is ready for collaboration."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-4 p-5 rounded-3xl border bg-card/40 backdrop-blur-md shadow-sm border-white/5">
              <div className="mt-1 p-2.5 rounded-2xl bg-blue-500/10 text-blue-500">
                <IconUser size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Creator</span>
                <span className="text-sm font-semibold truncate leading-tight">
                  {channel.createdBy
                    ? `${channel.createdBy.firstName} ${channel.createdBy.lastName}`
                    : "System Admin"}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 rounded-3xl border bg-card/40 backdrop-blur-md shadow-sm border-white/5">
              <div className="mt-1 p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-500">
                <IconCalendar size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Created On</span>
                <span className="text-sm font-semibold truncate leading-tight">
                  {new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }).format(new Date(channel.createdAt))}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 text-center">
            <button
              onClick={() => onJoin(channel.id)}
              disabled={isJoining}
              className="w-full group relative overflow-hidden transition-all hover:scale-[1.01] active:scale-95 disabled:hover:scale-100"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 transition-all group-hover:opacity-90 active:scale-95 rounded-2xl" />
              <div className="relative flex items-center justify-center gap-3 py-5 px-8 text-white font-bold text-lg whitespace-nowrap">
                {isJoining ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-r-transparent" />
                    Initializing Connection...
                  </>
                ) : (
                  <>
                    <span>Join Community</span>
                    <IconChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
            <p className="mt-6 text-xs text-muted-foreground/70 font-medium">
              By joining, you will be able to see message history and start sending messages.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
