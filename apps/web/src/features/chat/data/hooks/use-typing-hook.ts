import { useRef, useCallback } from "react";
import { getSocket } from "@/lib/socket";

export function useTyping(
  tenantId: string,
  token: string,
  chatId: string,
  type: "channel" | "direct",
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socket = getSocket(token, tenantId);

  const start = useCallback(() => {
    socket.emit("typing-start", {
      [type === "channel" ? "channelId" : "recipientId"]: chatId,
    });

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      socket.emit("typing-stop", {
        [type === "channel" ? "channelId" : "recipientId"]: chatId,
      });
    }, 1000);
  }, [socket, chatId, type]);

  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    socket.emit("typing-stop", {
      [type === "channel" ? "channelId" : "recipientId"]: chatId,
    });
  }, [socket, chatId, type]);

  return { start, stop };
}
