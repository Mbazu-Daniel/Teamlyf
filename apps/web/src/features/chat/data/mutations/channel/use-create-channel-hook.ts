import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createChannel } from "../../chat-api";
import { queryKeys } from "@/lib/queryKeys";

interface CreateChannelPayload {
  name: string;
  description: string;
}

export function useCreateChannel(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateChannelPayload) =>
      createChannel(tenantId, payload.name, payload.description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.channels(tenantId) });
    },
  });
}
