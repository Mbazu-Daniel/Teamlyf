import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../common/better-auth/session.guard";
import type { SessionMember } from "../../common/types";
import { CurrentMember, OrgMemberGuard, PermissionsGuard, RequirePermission } from "../rbac";
import { CreateEmployeeDto, CreateLeaveRequestDto, ReviewLeaveRequestDto, UpdateEmployeeDto } from "./dto";
import { HrService } from "./hr.service";
@ApiTags("HR") @ApiBearerAuth() @UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/hr")
export class HrController {
  constructor(private readonly hr: HrService) {}
  @Get("employees") @RequirePermission("hr", "read") employees(@Param("orgId") o: string) { return this.hr.listEmployees(o); }
  @Post("employees") @RequirePermission("hr", "create") createEmployee(@Param("orgId") o: string, @Body() b: CreateEmployeeDto) { return this.hr.createEmployee(o, b); }
  @Patch("employees/:employeeId") @RequirePermission("hr", "update") updateEmployee(@Param("orgId") o: string, @Param("employeeId") e: string, @Body() b: UpdateEmployeeDto) { return this.hr.updateEmployee(o, e, b); }
  @Get("org-chart") @RequirePermission("hr", "read") chart(@Param("orgId") o: string) { return this.hr.orgChart(o); }
  @Get("leave-requests") @RequirePermission("hr", "read") leave(@Param("orgId") o: string) { return this.hr.listLeave(o); }
  @Post("leave-requests") @RequirePermission("hr", "create") request(@Param("orgId") o: string, @CurrentMember() m: SessionMember, @Body() b: CreateLeaveRequestDto) { return this.hr.requestLeave(o, m.id, b); }
  @Patch("leave-requests/:leaveId") @RequirePermission("hr", "update") review(@Param("orgId") o: string, @Param("leaveId") l: string, @CurrentMember() m: SessionMember, @Body() b: ReviewLeaveRequestDto) { return this.hr.reviewLeave(o, l, m.id, b); }
}
