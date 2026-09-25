import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../../common/better-auth/session.guard";
import type { SessionMember } from "../../../common/types";
import { CurrentMember, OrgMemberGuard, PermissionsGuard, RequirePermission } from "../../rbac";
import { CreateLeaveRequestDto, UpdateLeaveRequestDto } from "./dto";
import { LeaveRequestService } from "./leave-request.service";

@ApiTags("HR leave requests")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/hr/leave")
export class LeaveRequestController {
  constructor(private readonly leaveRequests: LeaveRequestService) {}

  @Get()
  @RequirePermission("hr", "read")
  @ApiOperation({ summary: "Get the leave requests of the current member" })
  getLeaveRequests(@Param("orgId") orgId: string, @CurrentMember() member: SessionMember) {
    return this.leaveRequests.getLeaveRequests(orgId, member.id);
  }

  @Post()
  @RequirePermission("hr", "create")
  @ApiOperation({ summary: "Request leave" })
  createLeaveRequest(
    @Param("orgId") orgId: string,
    @CurrentMember() member: SessionMember,
    @Body() body: CreateLeaveRequestDto,
  ) {
    return this.leaveRequests.createLeaveRequest(orgId, member.id, body);
  }

  @Patch(":requestId")
  @RequirePermission("hr", "update", "requestId")
  @ApiOperation({ summary: "Approve or reject a leave request" })
  updateLeaveRequestStatus(
    @Param("orgId") orgId: string,
    @Param("requestId") requestId: string,
    @CurrentMember() member: SessionMember,
    @Body() body: UpdateLeaveRequestDto,
  ) {
    return this.leaveRequests.updateLeaveRequestStatus(orgId, member.id, requestId, body);
  }

  // Requester-only cancel is enforced in the service, so no route-level
  // hr permission here (the creator may only hold hr:read).
  @Delete(":requestId")
  @ApiOperation({ summary: "Cancel your own leave request" })
  cancelLeaveRequest(
    @Param("orgId") orgId: string,
    @Param("requestId") requestId: string,
    @CurrentMember() member: SessionMember,
  ) {
    return this.leaveRequests.cancelLeaveRequest(orgId, member.id, requestId);
  }
}
