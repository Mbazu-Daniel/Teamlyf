import { ForbiddenException } from "@nestjs/common";

export async function requireOrganizationMember<T>(
  findMember: () => Promise<T | undefined>,
): Promise<T> {
  const found = await findMember();
  if (!found) throw new ForbiddenException("Member is not in this organization");
  return found;
}
