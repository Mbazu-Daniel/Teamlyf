import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { leavePolicy, leaveRequest } from "@teamlyf/db";
import { and, desc, eq } from "drizzle-orm";
import { DATABASE } from "../../../common/db/db.provider";
import type { CreateLeavePolicyDto, UpdateLeavePolicyDto } from "./dto";

@Injectable()
export class LeavePolicyService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async getLeavePolicies(orgId: string) {
    return this.db.query.leavePolicy.findMany({
      where: eq(leavePolicy.organizationId, orgId),
      orderBy: [desc(leavePolicy.createdAt)],
    });
  }

  /** Resolves a policy inside the organization or fails with 404 — the seam other HR modules book against. */
  async getLeavePolicy(orgId: string, policyId: string) {
    const found = await this.db.query.leavePolicy.findFirst({
      where: and(eq(leavePolicy.id, policyId), eq(leavePolicy.organizationId, orgId)),
    });
    if (!found) throw new NotFoundException("Leave policy not found");
    return found;
  }

  async createLeavePolicy(orgId: string, dto: CreateLeavePolicyDto) {
    const [created] = await this.db
      .insert(leavePolicy)
      .values({ organizationId: orgId, name: dto.name, daysPerYear: dto.daysPerYear })
      .returning();
    return created;
  }

  async updateLeavePolicy(orgId: string, policyId: string, dto: UpdateLeavePolicyDto) {
    await this.getLeavePolicy(orgId, policyId);
    const [updated] = await this.db
      .update(leavePolicy)
      .set(dto)
      .where(and(eq(leavePolicy.id, policyId), eq(leavePolicy.organizationId, orgId)))
      .returning();
    return updated;
  }

  async deleteLeavePolicy(orgId: string, policyId: string) {
    const policy = await this.getLeavePolicy(orgId, policyId);
    const booked = await this.db.query.leaveRequest.findFirst({
      where: eq(leaveRequest.policyId, policy.id),
      columns: { id: true },
    });
    if (booked) throw new BadRequestException("Leave policy still has requests booked against it");
    await this.db
      .delete(leavePolicy)
      .where(and(eq(leavePolicy.id, policyId), eq(leavePolicy.organizationId, orgId)));
  }
}
