import { Inject, Injectable } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { leavePolicy, leaveRequest } from "@teamlyf/db";
import { and, eq } from "drizzle-orm";
import { DATABASE } from "../../../common/db/db.provider";
import { requireOrganizationMemberOrNotFound } from "../../../common/organization-member";
import type { LeaveBalance } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Balances are derived, not stored: every policy grants `daysPerYear` and the
 * approved leave of the member is deducted from it. No balance table to drift.
 */
@Injectable()
export class LeaveBalanceService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async getLeaveBalances(orgId: string, memberId: string): Promise<LeaveBalance[]> {
    await requireOrganizationMemberOrNotFound(this.db, orgId, memberId);
    const [policies, approvedRequests] = await Promise.all([
      this.db.query.leavePolicy.findMany({ where: eq(leavePolicy.organizationId, orgId) }),
      this.db.query.leaveRequest.findMany({
        where: and(
          eq(leaveRequest.organizationId, orgId),
          eq(leaveRequest.memberId, memberId),
          eq(leaveRequest.status, "approved"),
        ),
      }),
    ]);

    const usedByPolicy = new Map<string, number>();
    for (const request of approvedRequests) {
      const used = usedDays(request.startDate, request.endDate);
      usedByPolicy.set(request.policyId, (usedByPolicy.get(request.policyId) ?? 0) + used);
    }

    return policies.map((policy) => {
      const used = usedByPolicy.get(policy.id) ?? 0;
      return {
        policyId: policy.id,
        policyName: policy.name,
        daysPerYear: policy.daysPerYear,
        usedDays: used,
        remainingDays: Math.max(0, policy.daysPerYear - used),
      };
    });
  }
}

function usedDays(startDate: Date, endDate: Date) {
  return Math.round((endDate.getTime() - startDate.getTime()) / DAY_MS) + 1;
}
