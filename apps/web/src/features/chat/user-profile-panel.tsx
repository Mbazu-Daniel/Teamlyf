import { useState } from "react";
import { AddMemberToProject } from "@/features/projects/add-member-to-project";
import { IconMessage, IconPhone, IconShield, IconUserPlus, IconX } from "@tabler/icons-react";
import { useAppRouter } from "@/lib/navigation";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TenantMember } from "@/features/chat/types/tenant-members/types";
import { getAvatarColor } from "@/lib/utils/avatar-colors";
import { useAuthStore } from "@/lib/store/auth-store";
import { useTenantStore } from "@/lib/store/tenant-store";
import { useFetchTenantMembers } from "@/features/chat/data/queries/use-fetch-tenant-members-hook";

interface UserProfilePanelProps {
  member: Partial<TenantMember>;
  onClose: () => void;
}

export function UserProfilePanel({ member, onClose }: UserProfilePanelProps) {
  const [addToProject, setAddToProject] = useState(false);
  const org = useTenantStore((state) => state.tenantId);
  const router = useAppRouter();
  const currentSlug = useTenantStore((state) => state.subdomain);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { data: members } = useFetchTenantMembers(org ?? "");

  const myMemberId = members?.records?.find((m) => String(m.userId) === String(currentUserId))?.id;
  const isMe =
    member.isCurrentMember === true ||
    (myMemberId !== undefined && String(myMemberId) === String(member.id)) ||
    (member.userId !== undefined && String(currentUserId) === String(member.userId));

  const initials =
    `${member.firstName?.[0] ?? ""}${member.lastName?.[0] ?? ""}`.toUpperCase() || "U";
  const fullName = [member.firstName, member.lastName].filter(Boolean).join(" ") || "Unknown User";

  return (
    <>
      <div className="flex h-full min-h-0 flex-col bg-background">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-4 h-14 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <Avatar rounded="lg" className="h-8 w-8">
              <AvatarImage src={member.avatar || undefined} />
              <AvatarFallback
                rounded="lg"
                tone="white"
                size="xs"
                weight="bold"
                style={{ background: getAvatarColor(member.id) }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{fullName}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {member.role || "Member"}
              </p>
            </div>
          </div>
          <Button variant="ghost-muted" size="icon" className="h-7 w-7" onClick={onClose}>
            <IconX className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          <div className="p-4 space-y-5">
            {/* Profile Hero */}
            <div className="flex flex-col items-center text-center">
              <Avatar rounded="2xl" border="strong" elevation="sm" className="h-20 w-20">
                <AvatarImage src={member.avatar || undefined} />
                <AvatarFallback
                  rounded="2xl"
                  tone="white"
                  size="xl"
                  weight="bold"
                  style={{ background: getAvatarColor(member.id) }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="mt-3">
                <p className="text-base font-bold text-foreground">{fullName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {member.email || member.userId}
                </p>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                {member.role && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/50 px-2.5 py-1 text-[11px] font-semibold text-foreground">
                    <IconShield className="h-3 w-3 text-muted-foreground" />
                    {member.role}
                  </span>
                )}
                {member.department?.name && (
                  <span className="rounded-full border border-border/60 bg-muted/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    {member.department.name}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            {!isMe && (
              <div className="flex items-center gap-2">
                <Button
                  variant="soft"
                  size="sm-relaxed"
                  className="flex-1"
                  onClick={() => {
                    onClose();
                    router.push(`/${currentSlug}/chats/dm/${member.id}`);
                  }}
                >
                  <IconMessage className="h-3.5 w-3.5" />
                  Message
                </Button>
                <Button
                  variant="outline"
                  size="sm-relaxed"
                  className="flex-1"
                  onClick={() => setAddToProject(true)}
                >
                  <IconUserPlus className="h-3.5 h-3.5 w-3.5" />
                  Add to project
                </Button>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-border/60" />

            {/* Details */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Details
              </h4>
              <div className="space-y-2.5">
                {member.phoneNumber && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/50">
                      <IconPhone className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-muted-foreground">Phone</p>
                      <p className="truncate text-xs font-medium text-foreground">
                        {member.phoneNumber}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/50">
                    <IconShield className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-muted-foreground">Status</p>
                    <p className="text-xs font-medium text-foreground">
                      {member.status === "active" ? "Active" : "Inactive"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {addToProject && org && member.id && (
        <AddMemberToProject org={org} member={member.id} onClose={() => setAddToProject(false)} />
      )}
    </>
  );
}
