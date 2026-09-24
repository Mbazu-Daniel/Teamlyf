import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../../common/better-auth/session.guard";
import type { SessionMember } from "../../../common/types";
import { CurrentMember, OrgMemberGuard, PermissionsGuard, RequirePermission } from "../../rbac";
import { UpdateEmployeeProfileDto } from "./dto";
import { MemberProfileService } from "./member-profile.service";

@ApiTags("HR profiles")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/hr")
export class MemberProfileController {
  constructor(private readonly profiles: MemberProfileService) {}

  @Get("profiles")
  @RequirePermission("hr", "read")
  @ApiOperation({ summary: "Get every HR profile of the organization" })
  getMemberProfiles(@Param("orgId") orgId: string) {
    return this.profiles.getMemberProfiles(orgId);
  }

  @Get("profile")
  @RequirePermission("hr", "read")
  @ApiOperation({ summary: "Get the HR profile of the current member" })
  getMemberProfile(@Param("orgId") orgId: string, @CurrentMember() member: SessionMember) {
    return this.profiles.getMemberProfile(orgId, member.id);
  }

  @Patch("profile")
  @RequirePermission("hr", "update")
  @ApiOperation({ summary: "Update the HR profile of the current member" })
  updateMemberProfile(
    @Param("orgId") orgId: string,
    @CurrentMember() member: SessionMember,
    @Body() body: UpdateEmployeeProfileDto,
  ) {
    return this.profiles.updateMemberProfile(orgId, member.id, body);
  }
}
