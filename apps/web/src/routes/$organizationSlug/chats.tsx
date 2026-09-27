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
import { useIsMobile } from "@/hooks/use-mobile";
import { useGlobalChatSync } from "@/features/chat/data/hooks/use-global-chat-sync";
import { GlobalCallOverlay } from "@/features/chat/calls/global-call-overlay";

function RouteComponent({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenantId = useTenantStore((s) => s.tenantId);
  const accessToken = useAuthStore((s) => s.accessToken);

  // GLOBAL CHAT SYNC (Handles unread counts and sidebar updates for all rooms)
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
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // On mobile, if we are on the base chats page (no active chat/subpage selected),
  // we show the chat navigator as the main content.
  const isBaseChatPage = pathname.endsWith("/chats") || pathname.endsWith("/chats/");
  const showSidebarAsMain = isMobile && isBaseChatPage;

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
      <div className="flex h-full min-h-0 w-full flex-col bg-(--app-page-background)">
        <div className="mx-auto flex h-full min-h-0 w-full `max-w-360 flex-col gap-4 pb-2">
          {/* Desktop: Vertical sidebar rail + Chat + Thread panel */}
          <div className="hidden md:flex min-h-0 flex-1 overflow-hidden rounded-[16px] border border-[var(--app-panel-border)] bg-white/92 shadow-[0_20px_48px_-36px_rgba(15,23,42,0.32)]">
            <ResizablePanelGroup className="min-h-0 flex-1">
              {/* Card 1: Sidebar Rail (always visible) */}
              <ResizablePanel defaultSize={22} minSize={200} maxSize={300} className="h-full">
                <ChatSidebarRail />
              </ResizablePanel>

              {/* Card 2: Main chat content (always visible) */}
              <ResizablePanel defaultSize={isThreadPanelVisible ? 60 : 100} minSize={320} className="h-full">
                <main className="flex h-full flex-1 flex-col bg-chat-primary-bg">
                  {showSidebarAsMain ? (
                    <div className="h-full overflow-y-auto">
                      <ChatSidebarRail />
                    </div>
                  ) : (
                    children
                  )}
                </main>
              </ResizablePanel>

              {/* Card 3: Thread panel (conditional) */}
              {isThreadPanelVisible && !isMobile && (
                <ResizablePanel defaultSize={40} minSize={300} maxSize={420}>
                  <aside className="hidden h-full shrink-0 flex-col bg-background md:flex">
                    <ThreadView parentMessage={activeThread} event={activeThreadType} chatId={chatId} />
                  </aside>
                </ResizablePanel>
              )}
            </ResizablePanelGroup>
          </div>

          {/* Mobile: Simplified layout */}
          <div className="flex min-h-0 flex-1 flex-col md:hidden">
            <main className="flex h-full flex-1 flex-col bg-chat-primary-bg">
              <Outlet />
            </main>
          </div>
        </div>
      </div>

      {/* Mobile Thread Sheet */}
      {isMobile && (
        <Sheet open={isThreadOpen} onOpenChange={(open) => setIsThreadOpen(open)}>
          <SheetContent
            side="right"
            variant="flush"
            className="w-full md:hidden"
          >
            <SheetTitle className="sr-only">Thread</SheetTitle>
            {
              isThreadPanelVisible && (
                <ThreadView
                  parentMessage={activeThread}
                  event={activeThreadType}
                  chatId={chatId}
                />
              )
            }
          </SheetContent>
        </Sheet>
      )}

      {/* Desktop Profile Overlay */}
      {isProfileOpen && profileMember && !isMobile && (
        <div className="fixed inset-y-0 right-0 z-50 w-80 border-l border-border/60 bg-background shadow-2xl animate-in slide-in-from-right duration-200">
          <UserProfilePanel
            member={profileMember}
            onClose={() => {
              setIsProfileOpen(false);
              setProfileMember(null);
            }}
          />
        </div>
      )}

      {/* Mobile Profile Sheet */}
      {isMobile && (
        <Sheet open={isProfileOpen} onOpenChange={(open) => {
          setIsProfileOpen(open);
          if (!open) setProfileMember(null);
        }}>
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


export const Route = createFileRoute('/$organizationSlug/chats')({
  component: RouteComponent as any,
});
