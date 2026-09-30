import { useAppRouter } from "@/lib/navigation";
import { useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { useFetchTenantMembers } from "@/features/chat/data/queries/use-fetch-tenant-members-hook";
import { useGetConversations } from "@/features/chat/data/queries/dm/use-fetch-conversations-hook";
import { useTenantStore } from "@/lib/store/tenant-store";
import { useNewChatStore } from "@/lib/store/new-chat-store";
import { useGetChannels } from "@/features/chat/data/queries/channels/use-fetch-channels-hook";
import { TenantMember } from "@/features/chat/types/tenant-members/types";
import { Channel } from "@/features/chat/types/channel/types";
import { DirectMessagePreview } from "@/features/chat/types/conversation/types";
import { useAuthStore } from "@/lib/store/auth-store";
import { useGetCurrentUser } from "@/features/chat/data/queries/use-get-current-user-hook";

export function useChatSidebarRail() {
  const [openGroups, setOpenGroups] = useState(true);
  const [openDMs, setOpenDMs] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [openCreateGroup, setOpenCreateGroup] = useState(false);
  const router = useAppRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const tenantId = useTenantStore((state) => state.tenantId);
  const subdomain = useTenantStore((state) => state.subdomain);
  const setSelectedUser = useNewChatStore((state) => state.setSelectedUser);
  const [activeLink, setActiveLink] = useState<{
    type: "chat" | "channel";
    id: string | "calls" | "mentions" | "threads";
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const user = useAuthStore((state) => state.user);
  // Workspace photo is stored on the membership, so read it back from there.
  const me = useGetCurrentUser(tenantId ?? null);

  const { data: members } = useFetchTenantMembers(tenantId!);
  const { data: conversations = [], isLoading: isLoadingConversations } = useGetConversations(
    tenantId!,
  );
  const { data: channels = [], isLoading: isLoadingChannels } = useGetChannels(tenantId!);

  const filteredChannels = (channels || []).filter((c: Channel) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredConversations = (conversations || []).filter((c: DirectMessagePreview) =>
    `${c.otherMember.firstName} ${c.otherMember.lastName}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  const isLoading = isLoadingConversations || isLoadingChannels;

  const handleOnChatClick = (chatId: string) => {
    setActiveLink({ type: "chat", id: chatId });
    router.push(`/${subdomain}/chats/dm/${chatId}`);
  };
  const handleOnChannelClick = (channelId: string) => {
    setActiveLink({ type: "channel", id: channelId });
    router.push(`/${subdomain}/chats/channel/${channelId}`);
  };
  const handleOnCallsClick = () => {
    setActiveLink({ type: "chat", id: "calls" });
    router.push(`/${subdomain}/chats/calls`);
  };
  const handleOnMentionsClick = () => {
    setActiveLink({ type: "chat", id: "mentions" });
    router.push(`/${subdomain}/chats/mentions`);
  };
  const handleOnThreadsClick = () => {
    setActiveLink({ type: "chat", id: "threads" });
    router.push(`/${subdomain}/chats/threads`);
  };
  const handleSelectUser = (member: TenantMember) => {
    setSelectedUser(member);
    router.push(`/${subdomain}/chats/`);
  };

  const isActive = (type: "chat" | "channel", id: string | "calls" | "mentions" | "threads") => {
    if (id === "calls") return pathname.includes("/chats/calls");
    if (id === "mentions") return pathname.includes("/chats/mentions");
    if (id === "threads") return pathname.includes("/chats/threads");
    if (type === "chat") return pathname.includes(`/chats/dm/${id}`);
    if (type === "channel") return pathname.includes(`/chats/channel/${id}`);
    return activeLink?.type === type && activeLink.id === id;
  };

  return {
    openGroups,
    setOpenGroups,
    openDMs,
    setOpenDMs,
    openModal,
    setOpenModal,
    openCreateGroup,
    setOpenCreateGroup,
    router,
    subdomain,
    searchQuery,
    setSearchQuery,
    user,
    avatar: me.data?.avatar ?? null,
    members,
    conversations,
    filteredChannels,
    filteredConversations,
    isLoading,
    handleOnChatClick,
    handleOnChannelClick,
    handleOnCallsClick,
    handleOnMentionsClick,
    handleOnThreadsClick,
    handleSelectUser,
    isActive,
  };
}
