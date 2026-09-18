export const ORGANIZATION_ROLES = ["owner", "admin", "member"] as const;

export type OrganizationRole = (typeof ORGANIZATION_ROLES)[number];

export function parseOrganizationRoles(value: unknown): string[] {
  return (Array.isArray(value) ? value : [value])
    .flatMap((role) => (typeof role === "string" ? role.split(",") : []))
    .map((role) => role.trim())
    .filter(Boolean);
}
