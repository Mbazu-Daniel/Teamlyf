import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { leavePolicy, leaveRequest, memberProfile } from "@teamlyf/db";
import { and, desc, eq } from "drizzle-orm";
import { DATABASE } from "../../common/db/db.provider";
import { requireOrganizationMemberOrNotFound } from "../../common/organization-member";
import type { LeaveRequestDto, MemberProfileDto, ReviewLeaveDto } from "./hr.dto";

@Injectable()
export class HrService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async getProfile(orgId: string, memberId: string) {
    await requireOrganizationMemberOrNotFound(this.db, orgId, memberId);
    return this.db.query.memberProfile.findFirst({ where: and(eq(memberProfile.organizationId, orgId), eq(memberProfile.memberId, memberId)) });
  }

  async upsertProfile(orgId: string, memberId: string, dto: MemberProfileDto) {
    await requireOrganizationMemberOrNotFound(this.db, orgId, memberId);
    const existing = await this.db.query.memberProfile.findFirst({ where: and(eq(memberProfile.organizationId, orgId), eq(memberProfile.memberId, memberId)) });
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
      const [updated] = await this.db.update(memberProfile).set(values).where(and(eq(memberProfile.organizationId, orgId), eq(memberProfile.memberId, memberId))).returning();
      return updated;
    }
    const [created] = await this.db.insert(memberProfile).values(values).returning();
    return created;
  }

  async listProfiles(orgId: string) {
    return this.db.query.memberProfile.findMany({ where: eq(memberProfile.organizationId, orgId), orderBy: [desc(memberProfile.createdAt)] });
  }

  async requestLeave(orgId: string, memberId: string, dto: LeaveRequestDto) {
    await requireOrganizationMemberOrNotFound(this.db, orgId, memberId);
    const policy = await this.db.query.leavePolicy.findFirst({ where: and(eq(leavePolicy.id, dto.policyId), eq(leavePolicy.organizationId, orgId)) });
    if (!policy) throw new BadRequestException("Leave policy not found in organization");
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (end < start) throw new BadRequestException("Leave end date must not precede start date");
    const [created] = await this.db.insert(leaveRequest).values({
      organizationId: orgId, memberId, policyId: policy.id, startDate: start, endDate: end, reason: dto.reason ?? null,
    }).returning();
    return created;
  }

  async listLeaveRequests(orgId: string, memberId: string) {
    await requireOrganizationMemberOrNotFound(this.db, orgId, memberId);
    return this.db.query.leaveRequest.findMany({ where: and(eq(leaveRequest.organizationId, orgId), eq(leaveRequest.memberId, memberId)), orderBy: [desc(leaveRequest.createdAt)] });
  }

  async reviewLeave(orgId: string, reviewerId: string, requestId: string, dto: ReviewLeaveDto) {
    await requireOrganizationMemberOrNotFound(this.db, orgId, reviewerId);
    if (!["approved", "rejected"].includes(dto.status)) throw new BadRequestException("Status must be approved or rejected");
    const request = await this.db.query.leaveRequest.findFirst({ where: and(eq(leaveRequest.id, requestId), eq(leaveRequest.organizationId, orgId)) });
    if (!request) throw new NotFoundException("Leave request not found");
    const [updated] = await this.db.update(leaveRequest).set({ status: dto.status, reviewedById: reviewerId, reviewedAt: new Date() }).where(and(eq(leaveRequest.id, requestId), eq(leaveRequest.organizationId, orgId))).returning();
    return updated;
  }
}
