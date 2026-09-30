import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OrganizationMember } from "@/lib/api";
import { OWNER_ROLE, memberEmail, memberName } from "./member-utils";

export function MemberIdentity({
  member,
  jobTitle,
}: {
  member: OrganizationMember;
  jobTitle?: string | null;
}) {
  return (
    <div className="min-w-0">
      <p className="text-sm font-medium">{memberName(member)}</p>
      <p className="text-xs text-muted-foreground">{memberEmail(member)}</p>
      {jobTitle && <p className="text-xs text-muted-foreground">{jobTitle}</p>}
    </div>
  );
}

export function MemberActions({
  member,
  roles,
  busy,
  onRoleChange,
  onRemove,
}: {
  member: OrganizationMember;
  roles: string[];
  busy: boolean;
  onRoleChange: (memberId: string, role: string) => void;
  onRemove: (memberId: string) => void;
}) {
  if (member.role === OWNER_ROLE) {
    return (
      <span
        className="inline-flex h-8 items-center rounded-[8px] border border-border/80 bg-muted/50 px-3 text-xs font-semibold capitalize text-muted-foreground"
        title="Ownership is transferred, not assigned"
      >
        Owner
      </span>
    );
  }
  const choices = [...new Set([...roles, member.role])].filter((role) => role !== OWNER_ROLE);
  return (
    <div className="flex items-center gap-2">
      <Select
        value={member.role}
        items={Object.fromEntries(choices.map((role) => [role, role]))}
        onValueChange={(role) => onRoleChange(member.id, role)}
      >
        <SelectTrigger
          aria-label={`Role for ${memberName(member)}`}
          size="sm"
          className="w-auto"
          disabled={busy}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {choices.map((role) => (
            <SelectItem key={role} value={role}>
              {role}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <RemoveMemberButton member={member} busy={busy} onRemove={onRemove} />
    </div>
  );
}

function RemoveMemberButton({
  member,
  busy,
  onRemove,
}: {
  member: OrganizationMember;
  busy: boolean;
  onRemove: (memberId: string) => void;
}) {
  if (member.role === OWNER_ROLE) return null;
  return (
    <ConfirmDialog
      title="Remove this member?"
      description={`${memberName(member)} will lose access to this workspace.`}
      confirmLabel="Remove"
      cancelLabel="Keep member"
      destructive
      onConfirm={() => onRemove(member.id)}
      trigger={
        <Button variant="destructive" size="sm" disabled={busy}>
          {busy ? "Saving..." : "Remove"}
        </Button>
      }
    />
  );
}
