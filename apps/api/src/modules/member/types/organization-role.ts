export type OrganizationRole = string;

export const ORGANIZATION_OWNER_ROLE = "owner";

export function parseOrganizationRoles(value: unknown): string[] {
  return (Array.isArray(value) ? value : [value])
    .flatMap((role) => (typeof role === "string" ? role.split(",") : []))
    .map((role) => role.trim())
    .filter(Boolean);
}
