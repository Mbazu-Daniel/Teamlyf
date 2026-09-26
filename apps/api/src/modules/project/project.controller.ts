import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../common/better-auth/session.guard";
import { CurrentMember, OrgMemberGuard, PermissionsGuard, RequirePermission } from "../rbac";
import type { SessionMember } from "../../common/types";
import { CreateProjectDto, UpdateProjectDto } from "./dto";
import { ProjectService } from "./project.service";

@ApiTags("Projects")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/projects")
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @RequirePermission("pm", "create")
  @ApiOperation({ summary: "Create a project" })
  @ApiParam({ name: "orgId" })
  createProject(
    @Param("orgId") orgId: string,
    @CurrentMember() current: SessionMember,
    @Body() body: CreateProjectDto,
  ) {
    return this.projectService.createProject(orgId, body, current.id);
  }

  @Get()
  @RequirePermission("pm", "read")
  @ApiOperation({ summary: "Get projects" })
  @ApiParam({ name: "orgId" })
  getProjects(@Param("orgId") orgId: string) {
    return this.projectService.getProjects(orgId);
  }

  @Get(":projectId")
  @RequirePermission("pm", "read", "projectId")
  @ApiOperation({ summary: "Get a project" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  getProject(@Param("orgId") orgId: string, @Param("projectId") projectId: string) {
    return this.projectService.getProject(orgId, projectId);
  }

  @Patch(":projectId")
  @RequirePermission("pm", "update", "projectId")
  @ApiOperation({ summary: "Update a project" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  updateProject(
    @Param("orgId") orgId: string,
    @Param("projectId") projectId: string,
    @Body() body: UpdateProjectDto,
  ) {
    return this.projectService.updateProject(orgId, projectId, body);
  }

  @Delete(":projectId")
  @RequirePermission("pm", "delete", "projectId")
  @ApiOperation({ summary: "Delete a project" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  @ApiResponse({ status: 200, description: "Project deleted" })
  deleteProject(@Param("orgId") orgId: string, @Param("projectId") projectId: string) {
    return this.projectService.deleteProject(orgId, projectId);
  }
}
