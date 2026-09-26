import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../../common/better-auth/session.guard";
import { OrgMemberGuard, PermissionsGuard, RequirePermission } from "../../rbac";
import { CreateSprintDto, UpdateSprintDto } from "./dto";
import { SprintService } from "./sprint.service";

@ApiTags("Sprints")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/projects/:projectId/sprints")
export class SprintController {
  constructor(private readonly sprintService: SprintService) {}

  @Get()
  @RequirePermission("pm", "read", "projectId")
  @ApiOperation({ summary: "Get project sprints" })
  getSprints(@Param("orgId") orgId: string, @Param("projectId") projectId: string) {
    return this.sprintService.getSprints(orgId, projectId);
  }

  @Get(":sprintId")
  @RequirePermission("pm", "read", "projectId")
  @ApiOperation({ summary: "Get a project sprint" })
  getSprint(@Param("orgId") orgId: string, @Param("projectId") projectId: string, @Param("sprintId") sprintId: string) {
    return this.sprintService.getSprint(orgId, projectId, sprintId);
  }

  @Post()
  @RequirePermission("pm", "update", "projectId")
  @ApiOperation({ summary: "Create a project sprint" })
  createSprint(@Param("orgId") orgId: string, @Param("projectId") projectId: string, @Body() body: CreateSprintDto) {
    return this.sprintService.createSprint(orgId, projectId, body);
  }

  @Patch(":sprintId")
  @RequirePermission("pm", "update", "projectId")
  @ApiOperation({ summary: "Update a project sprint" })
  updateSprint(@Param("orgId") orgId: string, @Param("projectId") projectId: string, @Param("sprintId") sprintId: string, @Body() body: UpdateSprintDto) {
    return this.sprintService.updateSprint(orgId, projectId, sprintId, body);
  }

  @Delete(":sprintId")
  @RequirePermission("pm", "delete", "projectId")
  @ApiOperation({ summary: "Delete a project sprint" })
  deleteSprint(@Param("orgId") orgId: string, @Param("projectId") projectId: string, @Param("sprintId") sprintId: string) {
    return this.sprintService.deleteSprint(orgId, projectId, sprintId);
  }
}
