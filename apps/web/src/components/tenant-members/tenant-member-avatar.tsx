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
  /** Layout classes only (size/position). Visual treatments use the props below. */
  className?: string;
  /** Fallback color seed when member has no id. */
  colorId?: string;
  /** Layout classes only. Text treatments use `fallbackSize`. */
  fallbackClassName?: string;
  /** Optional stable storage key when available. */
  cacheKey?: string | null;
  /** Border treatment forwarded to <Avatar> (variants in components/ui/avatar.tsx). */
  border?: AvatarBorder;
  /** Initials text size forwarded to <AvatarFallback> (variants in components/ui/avatar.tsx). */
  fallbackSize?: AvatarFallbackSize;
}

/**
 * Renders a tenant member avatar from the resolved `avatar` media URL.
 * Never uses global user.image — only tenant member identity.
 * Remote URLs go through the shared media cache via AvatarImage.
 */
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
        <AvatarImage
          src={avatarUrl}
          alt={name}
          className="object-cover"
          cacheKey={cacheKey}
        />
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
