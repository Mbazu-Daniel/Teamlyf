import { useTenantStore } from "@/lib/store/tenant-store";
import { useThreadStore } from "@/lib/store/ui-stores";
import { useStartConversation } from "@/features/chat/data/mutations/dm/use-start-conversation-hook";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { IconSend, IconMenu, IconMessage } from "@tabler/icons-react";

interface User {
  firstName: string,
  lastName: string,
  id: string
}

interface EmptyChatProps {
  selectedUser: User | null;
}

export function EmptyChat({ selectedUser }: EmptyChatProps) {
  const [newMessage, setNewMessage] = useState('');
  const { tenantId, subdomain } = useTenantStore();
  const setIsChatSidebarOpen = useThreadStore((state) => state.setIsChatSidebarOpen);

  const startConversation = useStartConversation(tenantId!, subdomain as string);

  const { mutate: sendFirstMessage } = startConversation



  const handleSendMessage = () => {
    if (!newMessage.trim()) {
      toast.error("Message cannot be empty");
      return;
    }

    if (!selectedUser) {
      toast.error("Please select a user to message");
      return;
    }

    const payload = {
      recipientId: selectedUser.id,
      content: newMessage.trim()
    }
    sendFirstMessage(payload, {
      onError: () => {
        toast.error("Failed to start conversation");
      }
    })
  }

  if (!selectedUser) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        {/* Mobile menu header */}
        <div className="flex items-center border-b px-3 sm:px-4 py-3 shrink-0 md:hidden">
          <button
            className="p-1 hover:bg-muted rounded-lg transition-colors"
            aria-label="Open chat menu"
            onClick={() => setIsChatSidebarOpen(true)}
          >
            <IconMenu className="h-5 w-5" />
          </button>
        </div>

        {/* Empty state message */}
        <div className="flex min-h-0 flex-1 px-4 py-4 sm:px-6 md:py-6">
          <div className="relative flex h-full w-full flex-col items-center justify-start overflow-y-auto rounded-[16px] border border-dashed border-[var(--app-panel-border)] bg-gradient-to-b from-card to-primary/5 px-6 py-12 text-center">
            <div className="relative z-10 max-w-xl pt-8 md:pt-12">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[28px] bg-[linear-gradient(135deg,rgba(70,72,212,0.14),rgba(132,85,239,0.18))] shadow-[0_20px_44px_-32px_rgba(70,72,212,0.4)]">
                <IconMessage className="h-9 w-9 text-primary" />
              </div>

              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
                No conversation selected
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">
                Select a group or person from the chat list to start messaging and follow updates.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  size="app-wide"
                  variant="soft-body"
                  className="md:hidden"
                  onClick={() => setIsChatSidebarOpen(true)}
                >
                  Open Chat Menu
                </Button>
              </div>

              <div className="mt-8 opacity-40">
                <img
                  className="dark:invert"
                  src="/assets/messy.svg"
                  alt="Empty chat illustration"
                  width={200}
                  height={100}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header - responsive padding and layout */}
      <div className="flex items-center gap-2 sm:gap-3 border-b px-3 sm:px-4 py-3 shrink-0">
        {/* Mobile menu trigger */}
        <button
          className="p-1 hover:bg-muted rounded-lg transition-colors shrink-0 md:hidden"
          aria-label="Open chat menu"
          onClick={() => setIsChatSidebarOpen(true)}
        >
          <IconMenu className="h-5 w-5" />
        </button>

        <div className="h-8 sm:h-9 w-8 sm:w-9 rounded-full overflow-hidden bg-gray-200 shrink-0">
          <span className="flex items-center justify-center w-full h-full text-xs text-gray-600 font-semibold">
            {selectedUser.firstName[0]}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate">{[selectedUser.firstName, selectedUser.lastName].filter(Boolean).join(" ")}</p>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">@{selectedUser.firstName.toLowerCase()}</p>
        </div>
      </div>

      {/* Empty conversation state */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4 sm:gap-6 px-4 py-8">
        <div className="text-center space-y-3">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">
            Say hello to {selectedUser.firstName}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-sm">
            Start the conversation by sending your first message
          </p>
        </div>

        {/* Optional: Illustration */}
        <div className="opacity-40">
          <img
            className="dark:invert"
            src="/assets/messy.svg"
            alt="Start conversation illustration"
            width={200}
            height={100}
          />
        </div>
      </div>

      {/* Message Input - responsive padding */}
      <div className="border-t px-3 sm:px-4 py-3 sm:py-4 shrink-0">
        <div className="flex items-center gap-2 rounded-[14px] border border-border/70 bg-card px-3 py-3">
          <input
            className="flex-1 bg-transparent text-sm outline-none"
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button
            disabled={!newMessage}
            onClick={handleSendMessage}
            className="rounded-md bg-primary p-1.5 sm:p-2 text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 shrink-0"
          >
            <IconSend className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

//   <div className="flex-1">
//     {/* Pass a temporary "null" chatId until message is sent */}
//     <ChatContent chatId={selectedUser.id /* temp, real chatId assigned after first message */} />
//   </div>
