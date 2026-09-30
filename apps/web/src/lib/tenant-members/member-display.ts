export type MemberLike = {
  id?: string;
  preferredName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  name?: string | null;
  avatar?: string | null;
};

export function getMemberDisplayName(member: MemberLike | null | undefined): string {
  if (!member) return "Unknown member";
  const preferredName = member.preferredName?.trim();
  if (preferredName) return preferredName;
  const fullName = [member.firstName, member.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
  if (fullName) return fullName;
  if (member.name?.trim()) return member.name.trim();
  return member.email?.trim() || "Unknown member";
}

export function needsProfileSetup(member: MemberLike | null | undefined): boolean {
  if (!member) return false;
  return !member.firstName?.trim() || !member.lastName?.trim();
}

export function getMemberInitials(member: MemberLike | null | undefined): string {
  const name = getMemberDisplayName(member);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}
