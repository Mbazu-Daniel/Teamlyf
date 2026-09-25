import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../../common/better-auth/session.guard";
import type { SessionMember } from "../../../common/types";
import { CurrentMember, OrgMemberGuard, PermissionsGuard, RequirePermission } from "../../rbac";
import { LeaveBalanceService } from "./leave-balance.service";

@ApiTags("HR leave balances")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/hr/leave-balances")
export class LeaveBalanceController {
  constructor(private readonly balances: LeaveBalanceService) {}

  @Get()
  @RequirePermission("hr", "read")
  @ApiOperation({ summary: "Get the leave balances of the current member" })
  getLeaveBalances(@Param("orgId") orgId: string, @CurrentMember() member: SessionMember) {
    return this.balances.getLeaveBalances(orgId, member.id);
  }
}
