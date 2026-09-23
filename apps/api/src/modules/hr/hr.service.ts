import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { hrEmployeeProfile, hrLeavePolicy, hrLeaveRequest } from "@teamlyf/db";
import { and, desc, eq } from "drizzle-orm";
import { DATABASE } from "../../common/db/db.provider";
import { findOrganizationMember } from "../../common/organization-member";
import type { EmployeeProfileDto, LeaveRequestDto, ReviewLeaveDto } from "./hr.dto";

@Injectable()
export class HrService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  private async requireMember(orgId: string, memberId: string) {
    const found = await findOrganizationMember(this.db, orgId, memberId);
    if (!found) throw new NotFoundException("Member not found in organization");
    return found;
  }

  async getProfile(orgId: string, memberId: string) {
    await this.requireMember(orgId, memberId);
    return this.db.query.hrEmployeeProfile.findFirst({ where: and(eq(hrEmployeeProfile.organizationId, orgId), eq(hrEmployeeProfile.memberId, memberId)) });
  }

  async upsertProfile(orgId: string, memberId: string, dto: EmployeeProfileDto) {
    await this.requireMember(orgId, memberId);
    const existing = await this.db.query.hrEmployeeProfile.findFirst({ where: and(eq(hrEmployeeProfile.organizationId, orgId), eq(hrEmployeeProfile.memberId, memberId)) });
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
      const [updated] = await this.db.update(hrEmployeeProfile).set(values).where(and(eq(hrEmployeeProfile.organizationId, orgId), eq(hrEmployeeProfile.memberId, memberId))).returning();
      return updated;
    }
    const [created] = await this.db.insert(hrEmployeeProfile).values(values).returning();
    return created;
  }

  async listProfiles(orgId: string) {
    return this.db.query.hrEmployeeProfile.findMany({ where: eq(hrEmployeeProfile.organizationId, orgId), orderBy: [desc(hrEmployeeProfile.createdAt)] });
  }

  async requestLeave(orgId: string, memberId: string, dto: LeaveRequestDto) {
    await this.requireMember(orgId, memberId);
    const policy = await this.db.query.hrLeavePolicy.findFirst({ where: and(eq(hrLeavePolicy.id, dto.policyId), eq(hrLeavePolicy.organizationId, orgId)) });
    if (!policy) throw new BadRequestException("Leave policy not found in organization");
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (end < start) throw new BadRequestException("Leave end date must not precede start date");
    const [created] = await this.db.insert(hrLeaveRequest).values({
      organizationId: orgId, memberId, policyId: policy.id, startDate: start, endDate: end, reason: dto.reason ?? null,
    }).returning();
    return created;
  }

  async listLeaveRequests(orgId: string, memberId: string) {
    await this.requireMember(orgId, memberId);
    return this.db.query.hrLeaveRequest.findMany({ where: and(eq(hrLeaveRequest.organizationId, orgId), eq(hrLeaveRequest.memberId, memberId)), orderBy: [desc(hrLeaveRequest.createdAt)] });
  }

  async reviewLeave(orgId: string, reviewerId: string, requestId: string, dto: ReviewLeaveDto) {
    await this.requireMember(orgId, reviewerId);
    if (!["approved", "rejected"].includes(dto.status)) throw new BadRequestException("Status must be approved or rejected");
    const request = await this.db.query.hrLeaveRequest.findFirst({ where: and(eq(hrLeaveRequest.id, requestId), eq(hrLeaveRequest.organizationId, orgId)) });
    if (!request) throw new NotFoundException("Leave request not found");
    const [updated] = await this.db.update(hrLeaveRequest).set({ status: dto.status, reviewedById: reviewerId, reviewedAt: new Date() }).where(and(eq(hrLeaveRequest.id, requestId), eq(hrLeaveRequest.organizationId, orgId))).returning();
    return updated;
  }
}
