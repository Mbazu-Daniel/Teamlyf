import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSendMessage } from "@/features/chat/data/hooks/use-send-message";
import { useDeleteMessage } from "@/features/chat/data/hooks/use-delete-message";
import { Message } from "@/features/chat/types/messages/types";
import { queryKeys } from "@/lib/queryKeys";
import {
  appendMessageToInfiniteData,
  filterMessagesInInfiniteData,
  patchMessagesInInfiniteCaches,
} from "@/features/chat/data/message-query-cache";
import { toast } from "sonner";

type TypingControls = {
  start: () => void;
  stop: () => void;
};

type UseChannelMessageActionsParams = {
  tenantId: string;
  channelId: string;
  accessToken: string;
  myMemberId: string | undefined;
  message: string;
  setMessage: (value: string) => void;
  typing: TypingControls;
};

export function useChannelMessageActions({
  tenantId,
  channelId,
  accessToken,
  myMemberId,
  message,
  setMessage,
  typing,
}: UseChannelMessageActionsParams) {
  const queryClient = useQueryClient();
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const sendMessage = useSendMessage(tenantId, channelId, "channel", accessToken);
  const { deleteMessage } = useDeleteMessage(tenantId, accessToken);

  const handleSend = async (
    attachmentIds?: string[],
    mentionedMemberIds?: string[],
    finalContent?: string,
  ) => {
    const hasAttachments = attachmentIds && attachmentIds.length > 0;
    if (!message.trim() && !hasAttachments) return;

    const tempId = `temp-${Date.now()}`;
    const now = new Date().toISOString();
    const optimistic = {
      id: tempId,
      content: message,
      sender: {
        id: myMemberId ?? "",
        firstName: "You",
        lastName: "",
        avatar: null,
      },
      createdAt: now,
      status: "sending" as const,
    } satisfies Partial<Message> as Message;

    patchMessagesInInfiniteCaches(
      queryClient,
      queryKeys.chat.channelMessages(tenantId, channelId),
      (old) => appendMessageToInfiniteData(old, optimistic),
    );

    setMessage("");
    typing.stop();

    await sendMessage(finalContent || message, attachmentIds, tempId, mentionedMemberIds);
  };

  const cancelSending = (id: string) => {
    patchMessagesInInfiniteCaches(
      queryClient,
      queryKeys.chat.channelMessages(tenantId, channelId),
      (old) => filterMessagesInInfiniteData(old, (m) => m.id !== id),
    );
  };

  const retrySend = async (msg: Message) => {
    await sendMessage(msg.content, msg.attachmentIds, msg.id);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (confirm("Are you sure you want to delete this message?")) {
      try {
        await deleteMessage(messageId, "channel");
        patchMessagesInInfiniteCaches(
          queryClient,
          queryKeys.chat.channelMessages(tenantId, channelId),
          (old) => filterMessagesInInfiniteData(old, (m) => m.id !== messageId),
        );
      } catch {
        toast.error("Failed to delete message");
      }
    }
  };

  const handleBulkDelete = async (messageIds: string[]) => {
    try {
      setIsBulkDeleting(true);
      await Promise.all(messageIds.map((id) => deleteMessage(id, "channel")));

      patchMessagesInInfiniteCaches(
        queryClient,
        queryKeys.chat.channelMessages(tenantId, channelId),
        (old) => filterMessagesInInfiniteData(old, (m) => !messageIds.includes(m.id)),
      );
      toast.success(`${messageIds.length} messages deleted`);
    } catch {
      toast.error("Failed to delete some messages");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  return {
    isBulkDeleting,
    handleSend,
    cancelSending,
    retrySend,
    handleDeleteMessage,
    handleBulkDelete,
  };
}
