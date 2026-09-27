import { useMemo, useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useThreadStore } from "@/lib/store/ui-stores";
import { useTenantStore } from "@/lib/store/tenant-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { useSendMessage } from "@/features/chat/data/hooks/use-send-message";
import { useTyping } from "@/features/chat/data/hooks/use-typing-hook";
import { useThreadMessages } from "@/features/chat/data/hooks/use-thread-messages";
import { useFetchTenantMembers } from "@/features/chat/data/queries/use-fetch-tenant-members-hook";
import { useMessages } from "@/features/chat/data/queries/dm/use-fetch-messages-hook";
import { useChannelMessages } from "@/features/chat/data/queries/channels/use-fetch-channel-messages-hook";
import { Message } from "@/features/chat/types/messages/types";
import { TenantMember } from "@/features/chat/types/tenant-members/types";
import { ThreadMessage } from "@/features/chat/types/thread-messages/types";
import { queryKeys } from "@/lib/queryKeys";
import {
  flattenMessagePages,
  mapMessagesInInfiniteData,
  patchMessagesInInfiniteCaches,
} from "@/features/chat/data/message-query-cache";

export interface ThreadViewProps {
  parentMessage: Message;
  event: "channel" | "direct";
  chatId: string;
}

export function useThreadView({ parentMessage, event, chatId }: ThreadViewProps) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const tenantId = useTenantStore((s) => s.tenantId);
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;
  const accessToken = useAuthStore((s) => s.accessToken);
  const activeThreadType = useThreadStore((state) => state.activeThreadType);
  const { setIsThreadOpen, setActiveThread } = useThreadStore();
  const parentMessageId = parentMessage.id;
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: members } = useFetchTenantMembers(tenantId!);

  const { data: channelMessagesData } = useChannelMessages(tenantId!, chatId, 50, {
    enabled: event === "channel",
  });

  const { data: directMessagesData } = useMessages(tenantId!, chatId, 50, {
    enabled: event === "direct",
  });

  const channelMessages = useMemo(
    () => flattenMessagePages(channelMessagesData),
    [channelMessagesData]
  );
  const directMessages = useMemo(
    () => flattenMessagePages(directMessagesData),
    [directMessagesData]
  );

  const mainMessages = useMemo(() => {
    return event === "channel" ? channelMessages : directMessages;
  }, [event, channelMessages, directMessages]);

  const liveParentMessage = useMemo(
    () => mainMessages.find((m: Message) => m.id === parentMessageId) || parentMessage,
    [mainMessages, parentMessage, parentMessageId]
  );

  const myMemberId = useMemo(
    () => members?.records?.find((m: TenantMember) => String(m.userId) === String(userId))?.id,
    [members, userId]
  );

  const { data: replies = [], isLoading } = useThreadMessages(
    tenantId!,
    chatId,
    parentMessage.id,
    activeThreadType!
  );

  const isFirstLoad = useRef(true);
  useEffect(() => {
    if (!isLoading) {
      bottomRef.current?.scrollIntoView({
        behavior: isFirstLoad.current ? "auto" : "smooth",
      });
      isFirstLoad.current = false;
    }
  }, [replies, isLoading]);

  const typing = useTyping(tenantId!, accessToken!, chatId, event);
  const sendMessage = useSendMessage(
    tenantId!,
    chatId,
    event,
    accessToken!,
    parentMessageId
  );

  function closeThread() {
    setIsThreadOpen(false);
    setActiveThread({
      message: null,
      type: null,
    });
  }

  const threadCacheKey = ["threadMessages", activeThreadType, chatId, parentMessageId];

  const handleSend = async (
    attachmentIds?: string[],
    mentionedUserIds?: string[],
    finalContent?: string
  ) => {
    const hasAttachments = attachmentIds && attachmentIds.length > 0;
    if (!message.trim() && !hasAttachments) return;

    const tempId = `temp-${Date.now()}`;
    const now = new Date().toISOString();

    queryClient.setQueryData(threadCacheKey, (old: ThreadMessage[] = []) => [
      ...old,
      {
        id: tempId,
        content: message,
        sender: { id: myMemberId || "me", firstName: "You", lastName: "" },
        createdAt: now,
        attachments: attachmentIds || [],
        status: "sending",
        isCurrentUserMessage: true,
      },
    ]);

    const mainPrefix =
      event === "channel"
        ? queryKeys.chat.channelMessages(tenantId!, chatId)
        : queryKeys.chat.directMessages(tenantId!, chatId);

    patchMessagesInInfiniteCaches(queryClient, mainPrefix, (old) =>
      mapMessagesInInfiniteData(old, (msg) =>
        msg.id === parentMessageId
          ? {
              ...msg,
              threadCount: (msg.threadCount || 0) + 1,
              hasThreadedMessage: true,
              lastReplyTime: now,
            }
          : msg
      )
    );

    setMessage("");

    try {
      await sendMessage(finalContent || message, attachmentIds, tempId, mentionedUserIds);
    } catch {
      toast.error("Failed to send message. Please try again.");
    }
  };

  const cancelSending = (id: string) => {
    queryClient.setQueryData(threadCacheKey, (old: ThreadMessage[]) =>
      old.filter((m) => m.id !== id)
    );
  };

  const retrySend = (msg: Message | ThreadMessage) => {
    sendMessage(msg.content, msg.attachmentIds, msg.id);
  };

  function getTargetPayload() {
    if (event === "channel") return { channelId: chatId };
    if (event === "direct") return { conversationId: chatId };
    throw new Error("No target provided");
  }

  return {
    message,
    setMessage,
    tenantId,
    bottomRef,
    liveParentMessage,
    replies,
    isLoading,
    typing,
    closeThread,
    handleSend,
    cancelSending,
    retrySend,
    getTargetPayload,
    event,
  };
}
