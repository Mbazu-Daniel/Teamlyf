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
@Controller("organization/:orgId/leave")
export class LeaveRequestController {
  constructor(private readonly leaveRequests: LeaveRequestService) {}

  @Get("review")
  @RequirePermission("hr", "update")
  getReviewQueue(@Param("orgId") orgId: string) {
    return this.leaveRequests.getReviewQueue(orgId);
  }

  @Get()
  @RequirePermission("hr", "read")
  @ApiOperation({ summary: "Get the leave requests of the current member" })
  getLeaveRequests(@Param("orgId") orgId: string, @CurrentMember() member: SessionMember) {
    return this.leaveRequests.getLeaveRequests(orgId, member.id);
  }

  @Post()
  @RequirePermission("hr", "read")
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
