import { Inject, Injectable } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { memberProfile } from "@teamlyf/db";
import { and, desc, eq } from "drizzle-orm";
import { DATABASE } from "../../../common/db/db.provider";
import { requireOrganizationMemberOrNotFound } from "../../../common/organization-member";
import type { UpdateEmployeeProfileDto } from "./dto";

@Injectable()
export class MemberProfileService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async getMemberProfiles(orgId: string) {
    return this.db.query.memberProfile.findMany({
      where: eq(memberProfile.organizationId, orgId),
      orderBy: [desc(memberProfile.createdAt)],
    });
  }

  async getMemberProfile(orgId: string, memberId: string) {
    await requireOrganizationMemberOrNotFound(this.db, orgId, memberId);
    return this.db.query.memberProfile.findFirst({
      where: this.sameMember(orgId, memberId),
    });
  }

  /** Creates the profile on first write so a PATCH is always safe to send. */
  async updateMemberProfile(orgId: string, memberId: string, dto: UpdateEmployeeProfileDto) {
    await requireOrganizationMemberOrNotFound(this.db, orgId, memberId);
    const existing = await this.db.query.memberProfile.findFirst({
      where: this.sameMember(orgId, memberId),
    });
    const values = {
      organizationId: orgId,
      memberId,
      employeeNumber: dto.employeeNumber,
      jobTitle: dto.jobTitle,
      employmentType: dto.employmentType,
      status: dto.status,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      phone: dto.phone,
      address: dto.address,
      updatedAt: new Date(),
    };
    if (existing) {
      const [updated] = await this.db
        .update(memberProfile)
        .set(values)
        .where(this.sameMember(orgId, memberId))
        .returning();
      return updated;
    }
    const [created] = await this.db.insert(memberProfile).values(values).returning();
    return created;
  }

  private sameMember(orgId: string, memberId: string) {
    return and(eq(memberProfile.organizationId, orgId), eq(memberProfile.memberId, memberId));
  }
}
