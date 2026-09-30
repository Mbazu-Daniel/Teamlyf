import { useMemo } from "react";
import { useFetchTenantMembers } from "@/features/chat/data/queries/use-fetch-tenant-members-hook";
import { useChannelMembers } from "@/features/chat/data/queries/channels/use-fetch-channel-members-hook";
import { TenantMember } from "@/features/chat/types/tenant-members/types";
import { ChannelMember } from "@/features/chat/types/channel/types";

export function useComposerMembers(
  tenantId: string,
  channelId: string | undefined,
  type: "channel" | "direct" | undefined,
  mentionSearch: string,
) {
  const { data: allMembers } = useFetchTenantMembers(tenantId);
  const { data: channelMembers } = useChannelMembers(tenantId, channelId ?? "", {
    enabled: !!channelId && type === "channel",
  });

  const membersToUse = useMemo(() => {
    const raw = type === "channel" && channelId ? channelMembers : allMembers?.records || [];
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
  }, [type, channelId, channelMembers, allMembers]);

  const filteredMembers = useMemo(
    () =>
      (Array.isArray(membersToUse) ? membersToUse : []).filter((member: TenantMember) => {
        const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
        return fullName.includes(mentionSearch);
      }),
    [membersToUse, mentionSearch],
  );

  return { membersToUse, filteredMembers };
}
