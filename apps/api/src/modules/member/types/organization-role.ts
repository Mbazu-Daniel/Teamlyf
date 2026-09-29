export type OrganizationRole = string;

export function parseOrganizationRoles(value: unknown): string[] {
  return (Array.isArray(value) ? value : [value])
    .flatMap((role) => (typeof role === "string" ? role.split(",") : []))
    .map((role) => role.trim())
    .filter(Boolean);
}
