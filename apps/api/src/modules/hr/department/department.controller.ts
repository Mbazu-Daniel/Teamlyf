import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../../common/better-auth/session.guard";
import { OrgMemberGuard, PermissionsGuard, RequirePermission } from "../../rbac";
import { CreateDepartmentDto, UpdateDepartmentDto } from "./dto";
import { DepartmentService } from "./department.service";

@ApiTags("HR departments")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/hr/departments")
export class DepartmentController {
  constructor(private readonly departments: DepartmentService) {}

  @Get()
  @RequirePermission("hr", "read")
  @ApiOperation({ summary: "Get every department of the organization, with members" })
  @ApiParam({ name: "orgId" })
  getDepartments(@Param("orgId") orgId: string) {
    return this.departments.getDepartments(orgId);
  }

  @Post()
  @RequirePermission("hr", "create")
  @ApiOperation({ summary: "Create a department" })
  @ApiParam({ name: "orgId" })
  @ApiResponse({ status: 201, description: "Department created" })
  @ApiResponse({ status: 400, description: "Department name already exists" })
  createDepartment(@Param("orgId") orgId: string, @Body() body: CreateDepartmentDto) {
    return this.departments.createDepartment(orgId, body);
  }

  @Get(":departmentId")
  @RequirePermission("hr", "read", "departmentId")
  @ApiOperation({ summary: "Get a department, with members" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "departmentId" })
  getDepartment(@Param("orgId") orgId: string, @Param("departmentId") departmentId: string) {
    return this.departments.getDepartment(orgId, departmentId);
  }

  @Patch(":departmentId")
  @RequirePermission("hr", "update", "departmentId")
  @ApiOperation({ summary: "Update a department" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "departmentId" })
  updateDepartment(
    @Param("orgId") orgId: string,
    @Param("departmentId") departmentId: string,
    @Body() body: UpdateDepartmentDto,
  ) {
    return this.departments.updateDepartment(orgId, departmentId, body);
  }

  @Delete(":departmentId")
  @RequirePermission("hr", "delete", "departmentId")
  @ApiOperation({ summary: "Delete a department" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "departmentId" })
  deleteDepartment(@Param("orgId") orgId: string, @Param("departmentId") departmentId: string) {
    return this.departments.deleteDepartment(orgId, departmentId);
  }

  @Post(":departmentId/members/:memberId")
  @RequirePermission("hr", "update", "departmentId")
  @ApiOperation({ summary: "Add a member to a department" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "departmentId" })
  @ApiParam({ name: "memberId" })
  addMember(
    @Param("orgId") orgId: string,
    @Param("departmentId") departmentId: string,
    @Param("memberId") memberId: string,
  ) {
    return this.departments.addMember(orgId, departmentId, memberId);
  }

  @Delete(":departmentId/members/:memberId")
  @RequirePermission("hr", "update", "departmentId")
  @ApiOperation({ summary: "Remove a member from a department" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "departmentId" })
  @ApiParam({ name: "memberId" })
  removeMember(
    @Param("orgId") orgId: string,
    @Param("departmentId") departmentId: string,
    @Param("memberId") memberId: string,
  ) {
    return this.departments.removeMember(orgId, departmentId, memberId);
  }
}
