import { createFileRoute } from "@tanstack/react-router";

import { useEffect } from "react";
import { useNavigationStore, useThreadStore } from "@/lib/store/ui-stores";
import { MentionsList } from "@/features/chat/mentions/mentions-list";

function RouteComponent() {
  const setCurrentPage = useNavigationStore((s) => s.setCurrentPage);
  const setChatId = useThreadStore((s) => s.setChatId);

  useEffect(() => {
    setCurrentPage("Chats");
    setChatId(null);
  }, [setCurrentPage, setChatId]);

  return <MentionsList />;
}

export const Route = createFileRoute("/$organizationSlug/chats/mentions")({
  component: RouteComponent,
});
