import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../common/better-auth/session.guard";
import type { SessionMember } from "../../common/types";
import { CurrentMember, OrgMemberGuard, PermissionsGuard, RequirePermission } from "../rbac";
import { LeaveRequestDto, MemberProfileDto, ReviewLeaveDto } from "./hr.dto";
import { HrService } from "./hr.service";

@ApiTags("HR")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/hr")
export class HrController {
  constructor(private readonly hr: HrService) {}

  @Get("profiles")
  @RequirePermission("hr", "read")
  listProfiles(@Param("orgId") orgId: string) { return this.hr.listProfiles(orgId); }

  @Get("profile")
  @RequirePermission("hr", "read")
  profile(@Param("orgId") orgId: string, @CurrentMember() member: SessionMember) { return this.hr.getProfile(orgId, member.id); }

  @Patch("profile")
  @RequirePermission("hr", "update")
  upsertProfile(@Param("orgId") orgId: string, @CurrentMember() member: SessionMember, @Body() body: MemberProfileDto) {
    return this.hr.upsertProfile(orgId, member.id, body);
  }

  @Post("leave")
  @RequirePermission("hr", "create")
  requestLeave(@Param("orgId") orgId: string, @CurrentMember() member: SessionMember, @Body() body: LeaveRequestDto) {
    return this.hr.requestLeave(orgId, member.id, body);
  }

  @Get("leave")
  @RequirePermission("hr", "read")
  leave(@Param("orgId") orgId: string, @CurrentMember() member: SessionMember) { return this.hr.listLeaveRequests(orgId, member.id); }

  @Patch("leave/:requestId")
  @RequirePermission("hr", "update", "requestId")
  reviewLeave(@Param("orgId") orgId: string, @Param("requestId") requestId: string, @CurrentMember() member: SessionMember, @Body() body: ReviewLeaveDto) {
    return this.hr.reviewLeave(orgId, member.id, requestId, body);
  }
}
