import { useMemo } from "react";
import { useTenantStore } from "@/lib/store/tenant-store";
import { useFetchTenantMembers } from "@/features/chat/data/queries/use-fetch-tenant-members-hook";
import { useChannelMembers } from "@/features/chat/data/queries/channels/use-fetch-channel-members-hook";
import { ChannelMember } from "@/features/chat/types/channel/types";
import { TenantMember } from "@/features/chat/types/tenant-members/types";

export function useChatMembers(chatId: string, type: "channel" | "direct") {
  const tenantId = useTenantStore((state) => state.tenantId);

  const { data: allMembers } = useFetchTenantMembers(tenantId ?? "");
  const { data: channelMembers } = useChannelMembers(tenantId ?? "", chatId, {
    enabled: !!tenantId && !!chatId && type === "channel",
  });

  const membersToUse = useMemo(() => {
    const raw = (type === "channel" && chatId) ? channelMembers : (allMembers?.records || []);
    return (raw || []).map((m: TenantMember | ChannelMember) => {
      if ("tenantMember" in m) {
        return {
          ...m.tenantMember,
          tenantId: m.channelId,
          userId: m.tenantMember.id,
          role: "member",
          createdAt: m.joinedAt,
          updatedAt: m.joinedAt,
        } as TenantMember;
      }
      return m;
    });
  }, [type, chatId, channelMembers, allMembers]);

  return membersToUse;
}
