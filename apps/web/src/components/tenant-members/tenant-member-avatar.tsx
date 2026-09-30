import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  type AvatarBorder,
  type AvatarFallbackSize,
} from "@/components/ui/avatar";
import {
  getMemberDisplayName,
  getMemberInitials,
  type MemberLike,
} from "@/lib/tenant-members/member-display";
import { getAvatarColor } from "@/lib/utils/avatar-colors";
import { cn } from "@/lib/utils";

interface TenantMemberAvatarProps {
  member: MemberLike | null | undefined;

  className?: string;

  colorId?: string;

  fallbackClassName?: string;

  cacheKey?: string | null;

  border?: AvatarBorder;

  fallbackSize?: AvatarFallbackSize;
}

export function TenantMemberAvatar({
  member,
  className,
  colorId,
  fallbackClassName,
  cacheKey,
  border,
  fallbackSize,
}: TenantMemberAvatarProps) {
  const name = getMemberDisplayName(member);
  const initials = getMemberInitials(member);
  const seed = colorId || member?.id || name;
  const avatarUrl = member?.avatar?.trim() || undefined;

  return (
    <Avatar className={cn("shrink-0", className)} border={border}>
      {avatarUrl ? (
        <AvatarImage src={avatarUrl} alt={name} className="object-cover" cacheKey={cacheKey} />
      ) : null}
      <AvatarFallback
        tone="white"
        weight="semibold"
        size={fallbackSize}
        className={fallbackClassName}
        style={{ backgroundColor: getAvatarColor(seed) }}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
