import { Inject, Injectable } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { memberProfile } from "@teamlyf/db";
import { and, desc, eq } from "drizzle-orm";
import { DATABASE } from "../../../common/db/db.provider";
import { requireOrganizationMemberOrNotFound } from "../../../common/organization-member";
import type { UpdateEmergencyContactDto, UpdateEmployeeProfileDto } from "./dto";

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

  async getEmergencyContact(orgId: string, memberId: string) {
    await requireOrganizationMemberOrNotFound(this.db, orgId, memberId);
    const profile = await this.db.query.memberProfile.findFirst({
      where: this.sameMember(orgId, memberId),
    });
    // Defaults rather than four `?.`/`??` chains: a member with no profile row
    // reads as two nulls, which is what the response promises anyway.
    const { emergencyContactName = null, emergencyContactPhone = null } = profile ?? {};
    return { memberId, name: emergencyContactName, phone: emergencyContactPhone };
  }

  /** Creates the profile on first write so the first PATCH is always safe to send. */
  async updateEmergencyContact(orgId: string, memberId: string, dto: UpdateEmergencyContactDto) {
    await requireOrganizationMemberOrNotFound(this.db, orgId, memberId);
    const values = {
      emergencyContactName: dto.name,
      emergencyContactPhone: dto.phone,
      updatedAt: new Date(),
    };

    const existing = await this.db.query.memberProfile.findFirst({
      where: this.sameMember(orgId, memberId),
      columns: { memberId: true },
    });
    if (existing) {
      await this.db.update(memberProfile).set(values).where(this.sameMember(orgId, memberId));
    } else {
      await this.db
        .insert(memberProfile)
        .values({ organizationId: orgId, memberId, ...values })
        .onConflictDoUpdate({
          target: memberProfile.memberId,
          set: values,
        });
    }
    return { memberId, name: dto.name, phone: dto.phone };
  }

  private sameMember(orgId: string, memberId: string) {
    return and(eq(memberProfile.organizationId, orgId), eq(memberProfile.memberId, memberId));
  }
}
