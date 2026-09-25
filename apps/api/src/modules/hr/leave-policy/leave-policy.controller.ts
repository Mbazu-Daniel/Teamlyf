import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../../common/better-auth/session.guard";
import { OrgMemberGuard, PermissionsGuard, RequirePermission } from "../../rbac";
import { CreateLeavePolicyDto, UpdateLeavePolicyDto } from "./dto";
import { LeavePolicyService } from "./leave-policy.service";

@ApiTags("HR leave policies")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/hr/policies")
export class LeavePolicyController {
  constructor(private readonly policies: LeavePolicyService) {}

  @Get()
  @RequirePermission("hr", "read")
  @ApiOperation({ summary: "Get every leave policy of the organization" })
  getLeavePolicies(@Param("orgId") orgId: string) {
    return this.policies.getLeavePolicies(orgId);
  }

  @Get(":policyId")
  @RequirePermission("hr", "read", "policyId")
  @ApiOperation({ summary: "Get a leave policy" })
  getLeavePolicy(@Param("orgId") orgId: string, @Param("policyId") policyId: string) {
    return this.policies.getLeavePolicy(orgId, policyId);
  }

  @Post()
  @RequirePermission("hr", "create")
  @ApiOperation({ summary: "Create a leave policy" })
  createLeavePolicy(@Param("orgId") orgId: string, @Body() body: CreateLeavePolicyDto) {
    return this.policies.createLeavePolicy(orgId, body);
  }

  @Patch(":policyId")
  @RequirePermission("hr", "update", "policyId")
  @ApiOperation({ summary: "Update a leave policy" })
  updateLeavePolicy(
    @Param("orgId") orgId: string,
    @Param("policyId") policyId: string,
    @Body() body: UpdateLeavePolicyDto,
  ) {
    return this.policies.updateLeavePolicy(orgId, policyId, body);
  }

  @Delete(":policyId")
  @RequirePermission("hr", "delete", "policyId")
  @ApiOperation({ summary: "Delete a leave policy" })
  deleteLeavePolicy(@Param("orgId") orgId: string, @Param("policyId") policyId: string) {
    return this.policies.deleteLeavePolicy(orgId, policyId);
  }
}
