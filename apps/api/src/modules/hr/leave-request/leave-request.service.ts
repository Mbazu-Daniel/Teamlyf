import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { leaveRequest } from "@teamlyf/db";
import { and, desc, eq } from "drizzle-orm";
import { DATABASE } from "../../../common/db/db.provider";
import { requireOrganizationMemberOrNotFound } from "../../../common/organization-member";
import { LeavePolicyService } from "../leave-policy/leave-policy.service";
import type { CreateLeaveRequestDto, UpdateLeaveRequestDto } from "./dto";

@Injectable()
export class LeaveRequestService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly policies: LeavePolicyService,
  ) {}

  async getReviewQueue(orgId: string) {
    return this.db.query.leaveRequest.findMany({
      where: eq(leaveRequest.organizationId, orgId),
      orderBy: [desc(leaveRequest.createdAt)],
    });
  }

  async createLeaveRequest(orgId: string, memberId: string, dto: CreateLeaveRequestDto) {
    await requireOrganizationMemberOrNotFound(this.db, orgId, memberId);
    const policy = await this.policies.getLeavePolicy(orgId, dto.policyId);
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (end < start) throw new BadRequestException("Leave end date must not precede start date");
    const [created] = await this.db
      .insert(leaveRequest)
      .values({
        organizationId: orgId,
        memberId,
        policyId: policy.id,
        startDate: start,
        endDate: end,
        reason: dto.reason ?? null,
      })
      .returning();
    return created;
  }

  async getLeaveRequests(orgId: string, memberId: string) {
    await requireOrganizationMemberOrNotFound(this.db, orgId, memberId);
    return this.db.query.leaveRequest.findMany({
      where: and(eq(leaveRequest.organizationId, orgId), eq(leaveRequest.memberId, memberId)),
      orderBy: [desc(leaveRequest.createdAt)],
    });
  }

  async updateLeaveRequestStatus(
    orgId: string,
    reviewerId: string,
    requestId: string,
    dto: UpdateLeaveRequestDto,
  ) {
    await requireOrganizationMemberOrNotFound(this.db, orgId, reviewerId);
    const request = await this.db.query.leaveRequest.findFirst({
      where: and(eq(leaveRequest.id, requestId), eq(leaveRequest.organizationId, orgId)),
    });
    if (!request) throw new NotFoundException("Leave request not found");
    if (request.status !== "pending") throw new BadRequestException("Only pending requests can be reviewed");
    if (dto.status === "rejected" && !dto.reviewReason?.trim()) throw new BadRequestException("Explain why this request is being rejected");
    const [updated] = await this.db
      .update(leaveRequest)
      .set({ status: dto.status, reviewReason: dto.reviewReason?.trim() || null, reviewedById: reviewerId, reviewedAt: new Date() })
      .where(and(eq(leaveRequest.id, requestId), eq(leaveRequest.organizationId, orgId), eq(leaveRequest.status, "pending")))
      .returning();
    if (!updated) throw new BadRequestException("This request was already reviewed or cancelled");
    return updated;
  }

  async cancelLeaveRequest(orgId: string, memberId: string, requestId: string) {
    const request = await this.db.query.leaveRequest.findFirst({
      where: and(eq(leaveRequest.id, requestId), eq(leaveRequest.organizationId, orgId)),
    });
    if (!request) throw new NotFoundException("Leave request not found");
    if (request.memberId !== memberId) {
      throw new ForbiddenException("Only the requester can cancel their own leave request");
    }
    if (!["pending", "approved"].includes(request.status)) {
      throw new BadRequestException("Only pending or approved requests can be cancelled");
    }
    const [updated] = await this.db
      .update(leaveRequest)
      .set({ status: "cancelled" })
      .where(and(eq(leaveRequest.id, requestId), eq(leaveRequest.organizationId, orgId)))
      .returning();
    return updated;
  }
}
