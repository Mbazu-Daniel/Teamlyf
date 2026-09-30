import { useState } from "react";
import { toast } from "sonner";
import { IconMenu, IconMessage, IconSend, IconSparkles } from "@tabler/icons-react";
import { EmptyStateArt } from "@/components/ui/empty-state-art";
import { useStartConversation } from "@/features/chat/data/mutations/dm/use-start-conversation-hook";
import { useTenantStore } from "@/lib/store/tenant-store";
import { useThreadStore } from "@/lib/store/ui-stores";

interface User {
  firstName: string;
  lastName: string;
  id: string;
}

interface EmptyChatProps {
  selectedUser: User | null;
}

export function EmptyChat({ selectedUser }: EmptyChatProps) {
  const [newMessage, setNewMessage] = useState("");
  const { tenantId, subdomain } = useTenantStore();
  const setIsChatSidebarOpen = useThreadStore((state) => state.setIsChatSidebarOpen);

  const startConversation = useStartConversation(tenantId!, subdomain as string);
  const { mutate: sendFirstMessage } = startConversation;

  const handleSendMessage = () => {
    if (!newMessage.trim()) {
      toast.error("Message cannot be empty");
      return;
    }
    if (!selectedUser) {
      toast.error("Please select a user to message");
      return;
    }
    sendFirstMessage(
      { recipientId: selectedUser.id, content: newMessage.trim() },
      { onError: () => toast.error("Failed to start conversation") },
    );
  };

  if (!selectedUser) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center border-b px-3 py-3 sm:px-4 md:hidden">
          <button
            type="button"
            className="rounded-lg p-1 transition-colors hover:bg-muted"
            aria-label="Open chat menu"
            onClick={() => setIsChatSidebarOpen(true)}
          >
            <IconMenu className="size-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-8 sm:px-6">
          <div className="flex w-full max-w-md flex-col items-center text-center">
            <EmptyStateArt variant="chat" className="max-w-[220px]" />

            <h2 className="mt-6 text-lg font-semibold tracking-[-0.02em] text-foreground">
              Nothing open yet
            </h2>
            <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">
              Pick a channel or a teammate to pick up where your team left off.
            </p>
            <button
              type="button"
              onClick={() => setIsChatSidebarOpen(true)}
              className="mt-6 inline-flex h-9 items-center gap-1.5 rounded-[9px] border border-border bg-background px-3.5 text-xs font-semibold transition hover:bg-muted md:hidden"
            >
              <IconMenu className="size-4" />
              Browse chats
            </button>
          </div>
        </div>
      </div>
    );
  }

  const firstName = selectedUser.firstName?.trim() || "there";

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2.5 border-b px-3 py-3 sm:gap-3 sm:px-4">
        <button
          type="button"
          className="shrink-0 rounded-lg p-1 transition-colors hover:bg-muted md:hidden"
          aria-label="Open chat menu"
          onClick={() => setIsChatSidebarOpen(true)}
        >
          <IconMenu className="size-5" />
        </button>

        <div className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-muted text-xs font-semibold sm:size-9">
          {firstName[0]?.toUpperCase()}
        </div>
        <p className="min-w-0 flex-1 truncate text-sm font-medium">
          {[selectedUser.firstName, selectedUser.lastName].filter(Boolean).join(" ")}
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-4 py-8">
        <div className="grid size-14 place-items-center rounded-2xl bg-primary/10">
          <IconMessage className="size-6 text-primary" />
        </div>
        <div className="space-y-1.5 text-center">
          <h2 className="text-base font-semibold text-foreground sm:text-lg">
            Say hello to {firstName}
          </h2>
          <p className="mx-auto max-w-sm text-sm leading-6 text-muted-foreground">
            This conversation is empty. Send the first message to start it.
          </p>
        </div>

        <ul className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-muted-foreground">
          {["@mention teammates", "Share files and links", "Start a thread"].map((hint) => (
            <li
              key={hint}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1"
            >
              <IconSparkles className="size-3 opacity-60" />
              {hint}
            </li>
          ))}
        </ul>
      </div>

      <div className="shrink-0 border-t px-3 py-3 sm:px-4 sm:py-4">
        <div className="flex items-center gap-2 rounded-[14px] border border-border/70 bg-card px-3 py-3">
          <input
            aria-label={`Message ${firstName}`}
            className="flex-1 bg-transparent text-sm outline-none"
            placeholder={`Message ${firstName}`}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <button
            type="button"
            aria-label="Send message"
            disabled={!newMessage.trim()}
            onClick={handleSendMessage}
            className="shrink-0 rounded-md bg-primary p-1.5 text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:p-2"
          >
            <IconSend className="size-4 sm:size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
