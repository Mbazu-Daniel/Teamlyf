import { ForbiddenException } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { member } from "@teamlyf/db/organization-schema";
import { and, eq } from "drizzle-orm";

async function findOrganizationMember(db: Database, organizationId: string, memberId: string) {
  return db.query.member.findFirst({
    where: and(eq(member.id, memberId), eq(member.organizationId, organizationId)),
  });
}

export async function requireOrganizationMember(
  db: Database,
  organizationId: string,
  memberId: string,
) {
  const found = await findOrganizationMember(db, organizationId, memberId);
  if (!found) throw new ForbiddenException("Member is not in this organization");
  return found;
}
