import { createFileRoute } from "@tanstack/react-router";

import { useEffect } from "react";
import { useNavigationStore, useThreadStore } from "@/lib/store/ui-stores";
import { CallHistory } from "@/features/chat/calls/call-history";

function RouteComponent() {
  const setCurrentPage = useNavigationStore((s) => s.setCurrentPage);
  const setChatId = useThreadStore((s) => s.setChatId);

  useEffect(() => {
    setCurrentPage("Chats");
    setChatId(null); 
  }, [setCurrentPage, setChatId]);

  return (
    <div className="flex h-full bg-background border-l border-border/40">
      <div className="flex-1">
        <CallHistory />
      </div>
    </div>
  );
}


export const Route = createFileRoute('/$organizationSlug/chats/calls')({
  component: RouteComponent,
});
