import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuthStore } from "@/lib/store/auth-store";
import { TenantMemberAvatar } from "@/components/tenant-members/tenant-member-avatar";
import { getMemberDisplayName } from "@/lib/tenant-members/member-display";
import { TenantMember } from "@/features/chat/types/tenant-members/types";
import { DirectMessagePreview } from "@/features/chat/types/conversation/types";


interface NewChatModalProps {
  users: TenantMember[]; // list of all users you can chat with
  conversations: DirectMessagePreview[]; // list of existing conversations
  onSelectUser: (user: TenantMember) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}


export function NewChatModal({ conversations, users, onSelectUser, open, onOpenChange }: NewChatModalProps) {
  const { user } = useAuthStore();
  const userId = user?.id

  const existingConversationUserIds = new Set(
    conversations.map((conv: DirectMessagePreview) => conv.otherMember.id)
  );

  const filteredUsers = users.filter(u => u.userId !== userId && !existingConversationUserIds.has(u.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="compact" className="w-full sm:max-w-[30rem]">
        <DialogTitle>Select a User</DialogTitle>

        <div className="flex flex-col gap-3 mt-4 max-h-75 overflow-y-auto">
          {filteredUsers.map(u => (
            <div
              key={u.id}
              className="flex items-center gap-3 p-2 rounded hover:bg-sidebar-accent cursor-pointer"
              onClick={() => {
                onSelectUser(u);
                onOpenChange(false); // close modal after selection
              }}
            >
              <TenantMemberAvatar member={u} className="h-8 sm:h-9 w-8 sm:w-9" />
              <span>{getMemberDisplayName(u)}</span>
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center">No users available</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
