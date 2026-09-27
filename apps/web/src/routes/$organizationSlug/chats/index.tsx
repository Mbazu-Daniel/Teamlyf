import { createFileRoute } from "@tanstack/react-router";

import { useEffect } from "react";
import { useNavigationStore, useThreadStore } from "@/lib/store/ui-stores";
import { useNewChatStore } from "@/lib/store/new-chat-store";
import { EmptyChat } from "@/features/chat/empty-chat";


function RouteComponent() {
  const setCurrentPage = useNavigationStore((s) => s.setCurrentPage);
  const setChatId = useThreadStore((s) => s.setChatId);
  const selectedUser = useNewChatStore((state) => state.selectedUser);


  useEffect(() => {
    setCurrentPage("Chats");
    setChatId(null);
  }, [setCurrentPage, setChatId]);

  return (
    <div className="flex h-full">
      {/* Main Panel */}
      <div className="flex-1">
        <EmptyChat selectedUser={selectedUser} />
      </div>
    </div>
  );
}


export const Route = createFileRoute('/$organizationSlug/chats/')({
  component: RouteComponent,
});
