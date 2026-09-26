import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../../common/better-auth/session.guard";
import { OrgMemberGuard, PermissionsGuard, RequirePermission } from "../../rbac";
import { AddProjectMembersDto } from "./dto";
import { ProjectMemberService } from "./project-member.service";

@ApiTags("Project Members")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/projects/:projectId/members")
export class ProjectMemberController {
  constructor(private readonly projectMemberService: ProjectMemberService) {}

  @Get()
  @RequirePermission("pm", "read", "projectId")
  @ApiOperation({ summary: "Get project members" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  getMembers(@Param("orgId") orgId: string, @Param("projectId") projectId: string) {
    return this.projectMemberService.getMembers(orgId, projectId);
  }

  @Post()
  @RequirePermission("pm", "update", "projectId")
  @ApiOperation({ summary: "Add members to a project" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  addMembers(
    @Param("orgId") orgId: string,
    @Param("projectId") projectId: string,
    @Body() body: AddProjectMembersDto,
  ) {
    return this.projectMemberService.addMembers(orgId, projectId, body.memberIds);
  }

  @Delete(":memberId")
  @RequirePermission("pm", "update", "projectId")
  @ApiOperation({ summary: "Remove a member from a project" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  @ApiParam({ name: "memberId" })
  removeMember(
    @Param("orgId") orgId: string,
    @Param("projectId") projectId: string,
    @Param("memberId", ParseUUIDPipe) memberId: string,
  ) {
    return this.projectMemberService.removeMember(orgId, projectId, memberId);
  }
}
