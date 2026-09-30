import { getSocket } from "@/lib/socket";

export function useDeleteMessage(tenantId: string, token: string) {
  const deleteMessage = async (messageId: string, type: "channel" | "direct") => {
    if (!tenantId || !token || !messageId) return;

    const socket = getSocket(token, tenantId);

    return new Promise((resolve, reject) => {
      socket.emit(
        "delete-message",
        { messageId, messageType: type },
        (response: { success: boolean; error?: string }) => {
          if (response?.success) {
            resolve(true);
          } else {
            reject(response?.error || "Failed to delete message");
          }
        },
      );
    });
  };

  return { deleteMessage };
}
