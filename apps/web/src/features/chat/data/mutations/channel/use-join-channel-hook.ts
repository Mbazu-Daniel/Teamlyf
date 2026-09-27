import { useMutation, useQueryClient } from "@tanstack/react-query";
import { joinChannel } from "../../chat-api";
import { toast } from "sonner";
import { queryKeys } from "@/lib/queryKeys";

export function useJoinChannel(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (channelId: string) => joinChannel(tenantId, channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.channels(tenantId) });
      toast.success("Joined channel successfully");
    },
    onError: () => {
        toast.error("Failed to join channel");
    }
  });
}
