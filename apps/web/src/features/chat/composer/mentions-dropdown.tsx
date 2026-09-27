import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarColor } from "@/lib/utils/avatar-colors";
import { TenantMember } from "@/features/chat/types/tenant-members/types";

type MentionsDropdownProps = {
  members: TenantMember[];
  onSelect: (memberId: string, firstName: string, lastName: string) => void;
};

export function MentionsDropdown({ members, onSelect }: MentionsDropdownProps) {
  return (
    <div className="absolute bottom-full mb-2 left-0 bg-popover border border-border rounded-md shadow-md p-1 w-64 z-50 max-h-48 overflow-y-auto">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1 sticky top-0 bg-popover z-10">
        Team Members
      </p>
      {members.length > 0 ? (
        members.map((member) => (
          <button
            key={member.id}
            onClick={() =>
              onSelect(member.id, member.firstName, member.lastName)
            }
            className="w-full text-left px-2 py-1.5 hover:bg-primary-button/10 hover:text-primary-button rounded-md text-sm transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Avatar className="h-5 w-5 shrink-0">
              <AvatarImage src={member.avatar || undefined} />
              <AvatarFallback
                size="9px"
                tone="white"
                style={{ backgroundColor: getAvatarColor(member.id) }}
              >
                {member.firstName[0]}
                {member.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">
              <span className="text-primary-button font-medium">@</span>
              {member.firstName} {member.lastName}
            </span>
          </button>
        ))
      ) : (
        <div className="px-2 py-2 text-xs text-muted-foreground text-center">
          No matching members
        </div>
      )}
    </div>
  );
}
