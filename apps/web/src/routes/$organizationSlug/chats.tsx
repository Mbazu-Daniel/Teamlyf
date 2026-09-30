import { useRouterState, createFileRoute, Outlet } from "@tanstack/react-router";

import { ChatSidebarRail } from "@/features/chat/chat-sidebar-rail";
import { ThreadView } from "@/features/chat/thread-view";
import { UserProfilePanel } from "@/features/chat/user-profile-panel";
import { SocketProvider } from "@/components/socket-provider";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useThreadStore } from "@/lib/store/ui-stores";
import { useTenantStore } from "@/lib/store/tenant-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { useNewChatStore } from "@/lib/store/new-chat-store";
import { useIsMobile } from "@/hooks/use-mobile";
import { useGlobalChatSync } from "@/features/chat/data/hooks/use-global-chat-sync";
import { GlobalCallOverlay } from "@/features/chat/calls/global-call-overlay";

function RouteComponent() {
  const tenantId = useTenantStore((s) => s.tenantId);
  const accessToken = useAuthStore((s) => s.accessToken);

  useGlobalChatSync(tenantId!, accessToken!);

  const activeThread = useThreadStore((s) => s.activeThread);
  const activeThreadType = useThreadStore((s) => s.activeThreadType);
  const isThreadOpen = useThreadStore((s) => s.isThreadOpen);
  const isChatSidebarOpen = useThreadStore((s) => s.isChatSidebarOpen);
  const chatId = useThreadStore((s) => s.chatId);
  const profileMember = useThreadStore((s) => s.profileMember);
  const isProfileOpen = useThreadStore((s) => s.isProfileOpen);
  const setIsChatSidebarOpen = useThreadStore((s) => s.setIsChatSidebarOpen);
  const setIsThreadOpen = useThreadStore((s) => s.setIsThreadOpen);
  const setProfileMember = useThreadStore((s) => s.setProfileMember);
  const setIsProfileOpen = useThreadStore((s) => s.setIsProfileOpen);

  const isMobile = useIsMobile();
  const selectedUser = useNewChatStore((state) => state.selectedUser);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isBaseChatPage = pathname.endsWith("/chats") || pathname.endsWith("/chats/");
  const showSidebarAsMain = isMobile && isBaseChatPage && !selectedUser;

  const isThreadPanelVisible = isThreadOpen && activeThread && activeThreadType && chatId != null;

  return (
    <SocketProvider>
      <GlobalCallOverlay />
      {/* Mobile Sidebar Drawer - Only show if not on the main chats list page or if a chat is selected */}
      <Sheet open={isChatSidebarOpen} onOpenChange={(open) => setIsChatSidebarOpen(open)}>
        <SheetContent side="left" variant="flush" className="w-70 md:hidden">
          <SheetTitle className="sr-only">Chat Menu</SheetTitle>
          <div className="h-full overflow-y-auto">
            <ChatSidebarRail />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Layout */}
      <div className="flex h-full min-h-0 w-full flex-col">
        <div className="mx-auto flex h-full min-h-0 w-full max-w-[1440px] flex-col gap-4 px-4 py-5 pb-6 sm:px-6 lg:px-8">
          {/* Desktop: Vertical sidebar rail + Chat + Thread panel */}
          <div className="hidden md:flex min-h-0 flex-1 overflow-hidden rounded-[16px] border border-[var(--app-panel-border)] bg-card shadow-[0_8px_20px_-20px_rgba(15,23,42,0.2)]">
            <ResizablePanelGroup className="min-h-0 flex-1">
              {/* Card 1: Sidebar Rail (always visible) */}
              <ResizablePanel defaultSize={22} minSize={200} maxSize={300} className="h-full">
                <ChatSidebarRail />
              </ResizablePanel>

              {/* Card 2: Main chat content (always visible) */}
              <ResizablePanel
                defaultSize={isThreadPanelVisible ? 60 : 100}
                minSize={320}
                className="h-full"
              >
                <main className="flex h-full flex-1 flex-col bg-chat-primary-bg">
                  {showSidebarAsMain ? (
                    <div className="h-full overflow-y-auto">
                      <ChatSidebarRail />
                    </div>
                  ) : (
                    <Outlet />
                  )}
                </main>
              </ResizablePanel>

              {/* Card 3: Thread panel (conditional) */}
              {isThreadPanelVisible && !isMobile && (
                <ResizablePanel defaultSize={40} minSize={300} maxSize={420}>
                  <aside className="hidden h-full shrink-0 flex-col bg-background md:flex">
                    <ThreadView
                      parentMessage={activeThread}
                      event={activeThreadType}
                      chatId={chatId}
                    />
                  </aside>
                </ResizablePanel>
              )}
            </ResizablePanelGroup>
          </div>

          {/* Mobile: Simplified layout */}
          <div className="flex min-h-0 flex-1 flex-col md:hidden">
            <main className="flex h-full flex-1 flex-col bg-chat-primary-bg">
              {showSidebarAsMain ? <ChatSidebarRail /> : <Outlet />}
            </main>
          </div>
        </div>
      </div>

      {/* Mobile Thread Sheet */}
      {isMobile && (
        <Sheet open={isThreadOpen} onOpenChange={(open) => setIsThreadOpen(open)}>
          <SheetContent side="right" variant="flush" className="w-full md:hidden">
            <SheetTitle className="sr-only">Thread</SheetTitle>
            {isThreadPanelVisible && (
              <ThreadView parentMessage={activeThread} event={activeThreadType} chatId={chatId} />
            )}
          </SheetContent>
        </Sheet>
      )}

      {/* Desktop profile side panel */}
      {!isMobile && (
        <Sheet
          open={isProfileOpen}
          onOpenChange={(open) => {
            setIsProfileOpen(open);
            if (!open) setProfileMember(null);
          }}
        >
          <SheetContent side="right" variant="flushRoundedLeft" className="w-full sm:max-w-80">
            <SheetTitle className="sr-only">Profile</SheetTitle>
            {profileMember && (
              <UserProfilePanel
                member={profileMember}
                onClose={() => {
                  setIsProfileOpen(false);
                  setProfileMember(null);
                }}
              />
            )}
          </SheetContent>
        </Sheet>
      )}

      {/* Mobile Profile Sheet */}
      {isMobile && (
        <Sheet
          open={isProfileOpen}
          onOpenChange={(open) => {
            setIsProfileOpen(open);
            if (!open) setProfileMember(null);
          }}
        >
          <SheetContent side="right" variant="flush" className="w-full">
            <SheetTitle className="sr-only">Profile</SheetTitle>
            {profileMember && (
              <UserProfilePanel
                member={profileMember}
                onClose={() => {
                  setIsProfileOpen(false);
                  setProfileMember(null);
                }}
              />
            )}
          </SheetContent>
        </Sheet>
      )}
    </SocketProvider>
  );
}

export const Route = createFileRoute("/$organizationSlug/chats")({
  component: RouteComponent,
});
