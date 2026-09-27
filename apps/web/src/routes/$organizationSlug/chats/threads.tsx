import { createFileRoute } from "@tanstack/react-router";

import { useEffect } from "react";
import { useNavigationStore, useThreadStore } from "@/lib/store/ui-stores";
import { ThreadsList } from "@/features/chat/threads/threads-list";

function RouteComponent() {
  const setCurrentPage = useNavigationStore((s) => s.setCurrentPage);
  const setChatId = useThreadStore((s) => s.setChatId);

  useEffect(() => {
    setCurrentPage("Chats");
    setChatId(null);
  }, [setCurrentPage, setChatId]);

  return <ThreadsList />;
}


export const Route = createFileRoute('/$organizationSlug/chats/threads')({
  component: RouteComponent,
});
