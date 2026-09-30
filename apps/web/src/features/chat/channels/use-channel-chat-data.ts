import { useEffect, useMemo, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useThreadStore } from "@/lib/store/ui-stores";
import { useTenantStore } from "@/lib/store/tenant-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { useChatEvents } from "@/features/chat/data/hooks/use-chat-events-hook";
import { useTyping } from "@/features/chat/data/hooks/use-typing-hook";
import { useGetChannels } from "@/features/chat/data/queries/channels/use-fetch-channels-hook";
import { useFetchTenantMembers } from "@/features/chat/data/queries/use-fetch-tenant-members-hook";
import { useMarkChannelAsRead } from "@/features/chat/data/mutations/channel/use-mark-channel-as-read-hook";
import { useReactions } from "@/features/chat/data/hooks/use-reaction-hook";
import { useChannelMessages } from "@/features/chat/data/queries/channels/use-fetch-channel-messages-hook";
import { useJoinChannel } from "@/features/chat/data/mutations/channel/use-join-channel-hook";
import { useChannelMembers } from "@/features/chat/data/queries/channels/use-fetch-channel-members-hook";
import { Channel } from "@/features/chat/types/channel/types";
import { TenantMember } from "@/features/chat/types/tenant-members/types";
import { Message, TypingUser } from "@/features/chat/types/messages/types";
import { flattenMessagePages } from "@/features/chat/data/message-query-cache";

export function useChannelChatData(channelId: string) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const tenantId = useTenantStore((s) => s.tenantId);
  const subdomain = useTenantStore((s) => s.subdomain);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const { setChatId, setActiveThread, setIsThreadOpen } = useThreadStore();
  const userId = user?.id;

  const { mutate: joinChannel, isPending: isJoining } = useJoinChannel(tenantId!);
  const { data: channels = [] } = useGetChannels(tenantId!);
  const { data: members } = useFetchTenantMembers(tenantId!);

  const channel = useMemo(
    () => channels.find((c: Channel) => c.id === channelId),
    [channels, channelId],
  );

  const isMember = !!channel?.isMember;

  const {
    data: messagesData,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useChannelMessages(tenantId!, channelId, 50, { enabled: isMember });

  const messages = useMemo(() => flattenMessagePages(messagesData), [messagesData]);

  const myMemberId = useMemo(
    () => members?.records?.find((m: TenantMember) => String(m.userId) === String(userId))?.id,
    [members, userId],
  );

  const { data: channelMembers = [] } = useChannelMembers(tenantId!, channelId, {
    enabled: isMember,
  });

  const { typingUsers } = useChatEvents(tenantId!, channelId, "channel", accessToken!, isMember);

  const __searchStr = useRouterState({
    select: (s) => s.location.searchStr || s.location.search || "",
  });
  const searchParams = useMemo(
    () =>
      new URLSearchParams(typeof __searchStr === "string" ? __searchStr.replace(/^\?/, "") : ""),
    [__searchStr],
  );
  const threadId = searchParams.get("threadId");

  useEffect(() => {
    if (threadId && messages.length > 0) {
      const parentMsg = messages.find((m: Message) => m.id === threadId);
      if (parentMsg) {
        setActiveThread({ message: parentMsg, type: "channel" });
        setIsThreadOpen(true);
      }
    }
  }, [threadId, messages, setActiveThread, setIsThreadOpen]);

  const typingUserNames = useMemo(() => {
    return typingUsers
      .filter((u: TypingUser) => u.id !== myMemberId && u.id !== userId)
      .map((u: TypingUser) => {
        if (u.name) return u.name;
        if (u.firstName) return u.firstName;
        const id = u.id;
        const member = channelMembers.find((m: TenantMember) => m.id === id || m.userId === id);
        const globalMember = members?.records?.find(
          (m: TenantMember) => m.id === id || m.userId === id,
        );
        return member?.firstName || globalMember?.firstName || "Someone";
      });
  }, [typingUsers, myMemberId, userId, channelMembers, members]);

  const typing = useTyping(tenantId!, accessToken!, channelId, "channel");

  const { addReaction, removeReaction } = useReactions(
    tenantId!,
    accessToken!,
    "channel",
    channelId,
    myMemberId,
  );

  const { mutate } = useMarkChannelAsRead(tenantId!, channelId);

  useEffect(() => {
    if (channelId) {
      setChatId(channelId);
      mutate(channelId);
    }
    return () => {
      setChatId(null);
    };
  }, [channelId, mutate, setChatId]);

  return {
    bottomRef,
    tenantId,
    subdomain,
    accessToken,
    userId,
    channel,
    isMember,
    messages,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    myMemberId,
    channelMembers,
    typingUsers,
    typingUserNames,
    typing,
    joinChannel,
    isJoining,
    addReaction,
    removeReaction,
  };
}
