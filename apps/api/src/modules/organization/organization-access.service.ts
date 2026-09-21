import { ForbiddenException, Injectable } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { member, organization } from "@teamlyf/db/organization-schema";
import { and, eq } from "drizzle-orm";
import type { SessionMember } from "../../common/types";

export type AccessibleOrganization = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  role: string;
  memberId: string;
};

@Injectable()
export class OrganizationAccessService {
  constructor(private readonly db: Database) {}

  async listForUser(userId: string): Promise<AccessibleOrganization[]> {
    return this.db
      .select({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        logo: organization.logo,
        role: member.role,
        memberId: member.id,
      })
      .from(member)
      .innerJoin(organization, eq(member.organizationId, organization.id))
      .where(eq(member.userId, userId));
  }

  async getMember(userId: string, organizationId: string): Promise<SessionMember | null> {
    const found = await this.db.query.member.findFirst({
      where: and(
        eq(member.organizationId, organizationId),
        eq(member.userId, userId),
      ),
    });

    if (!found) return null;

    return {
      id: found.id,
      organizationId: found.organizationId,
      userId: found.userId,
      role: found.role,
      createdAt: found.createdAt,
    };
  }

  async requireMember(userId: string, organizationId: string): Promise<SessionMember> {
    const currentMember = await this.getMember(userId, organizationId);
    if (!currentMember) {
      throw new ForbiddenException("Not a member of this organization");
    }

    return currentMember;
  }
}
