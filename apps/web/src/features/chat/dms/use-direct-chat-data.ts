import { useEffect, useMemo, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useThreadStore } from "@/lib/store/ui-stores";
import { useTenantStore } from "@/lib/store/tenant-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { useMessages } from "@/features/chat/data/queries/dm/use-fetch-messages-hook";
import { useChatEvents } from "@/features/chat/data/hooks/use-chat-events-hook";
import { useTyping } from "@/features/chat/data/hooks/use-typing-hook";
import { useGetConversations } from "@/features/chat/data/queries/dm/use-fetch-conversations-hook";
import { useFetchTenantMembers } from "@/features/chat/data/queries/use-fetch-tenant-members-hook";
import { useMarkConversationAsRead } from "@/features/chat/data/mutations/dm/use-mark-as-read-hook";
import { useReactions } from "@/features/chat/data/hooks/use-reaction-hook";
import { TenantMember } from "@/features/chat/types/tenant-members/types";
import { DirectMessagePreview } from "@/features/chat/types/conversation/types";
import { Message, TypingUser } from "@/features/chat/types/messages/types";
import { flattenMessagePages } from "@/features/chat/data/message-query-cache";

export function useDirectChatData(chatId: string) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const tenantId = useTenantStore((s) => s.tenantId);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const { setChatId, setActiveThread, setIsThreadOpen } = useThreadStore();
  const userId = user?.id;

  const { data: conversations = [] } = useGetConversations(tenantId!);
  const { data: members } = useFetchTenantMembers(tenantId!);
  const {
    data: messagesData,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useMessages(tenantId!, chatId);

  const messages = useMemo(() => flattenMessagePages(messagesData), [messagesData]);

  const conversation = useMemo(
    () =>
      conversations.find(
        (c: DirectMessagePreview) => String(c.otherMember.id) === String(chatId),
      ),
    [conversations, chatId],
  );

  const myMemberId = useMemo(
    () =>
      members?.records?.find((m: TenantMember) => String(m.userId) === String(userId))?.id,
    [members, userId],
  );

  const { typingUsers } = useChatEvents(tenantId!, chatId, "direct", accessToken!);

  const __searchStr = useRouterState({
    select: (s) => s.location.searchStr || s.location.search || "",
  });
  const searchParams = useMemo(
    () =>
      new URLSearchParams(
        typeof __searchStr === "string" ? __searchStr.replace(/^\?/, "") : "",
      ),
    [__searchStr],
  );
  const threadId = searchParams.get("threadId");

  useEffect(() => {
    if (threadId && messages.length > 0) {
      const parentMsg = messages.find((m: Message) => String(m.id) === threadId);
      if (parentMsg) {
        setActiveThread({ message: parentMsg, type: "direct" });
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
        const member = members?.records?.find(
          (m: TenantMember) => m.id === id || m.userId === id,
        );
        return member?.firstName || conversation?.otherMember?.firstName || "Someone";
      });
  }, [typingUsers, myMemberId, userId, members, conversation]);

  const typing = useTyping(tenantId!, accessToken!, chatId, "direct");

  const { addReaction, removeReaction } = useReactions(
    tenantId!,
    accessToken!,
    "direct",
    chatId,
    myMemberId,
  );

  const { mutate } = useMarkConversationAsRead(tenantId!, chatId);

  useEffect(() => {
    if (chatId) {
      setChatId(chatId);
      mutate(chatId);
    }
    return () => {
      setChatId(null);
    };
  }, [chatId, mutate, setChatId]);

  return {
    bottomRef,
    tenantId,
    accessToken,
    conversation,
    messages,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    myMemberId,
    typingUserNames,
    typing,
    addReaction,
    removeReaction,
  };
}
