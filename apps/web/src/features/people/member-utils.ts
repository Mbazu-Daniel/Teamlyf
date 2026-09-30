export const OWNER_ROLE = "owner";

type MemberNameParts = {
  firstName?: string | null;
  lastName?: string | null;
  user?: { name?: string | null; email?: string | null } | null;
};

export function memberName(m: MemberNameParts): string {
  const full = [m.firstName, m.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
  return full || m.user?.name || "Name not set";
}

export function memberEmail(m: MemberNameParts): string {
  return m.user?.email || "Email not set";
}

export function initialsOf(name?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
