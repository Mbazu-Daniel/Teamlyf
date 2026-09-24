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
import { SessionGuard } from "../../../common/better-auth/session.guard";
import {
  CurrentMember,
  OrgMemberGuard,
  PermissionsGuard,
  RequirePermission,
} from "../../rbac";
import type { SessionMember } from "../../../common/types";
import { CreateMilestoneDto, UpdateMilestoneDto } from "./dto";
import { MilestoneService } from "./milestone.service";

@ApiTags("Milestones")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/projects/:projectId/milestones")
export class MilestoneController {
  constructor(private readonly milestoneService: MilestoneService) {}

  @Post()
  @RequirePermission("pm", "create")
  @ApiOperation({ summary: "Create a milestone" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  createMilestone(
    @Param("orgId") orgId: string,
    @Param("projectId") projectId: string,
    @Body() body: CreateMilestoneDto,
    @CurrentMember() member: SessionMember,
  ) {
    return this.milestoneService.createMilestone(orgId, projectId, body, member.id);
  }

  @Get()
  @RequirePermission("pm", "read")
  @ApiOperation({ summary: "Get milestones" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  getMilestones(@Param("orgId") orgId: string, @Param("projectId") projectId: string) {
    return this.milestoneService.getMilestones(orgId, projectId);
  }

  @Patch(":milestoneId")
  @RequirePermission("pm", "update", "projectId")
  @ApiOperation({ summary: "Update a milestone" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  @ApiParam({ name: "milestoneId" })
  updateMilestone(
    @Param("orgId") orgId: string,
    @Param("projectId") projectId: string,
    @Param("milestoneId") milestoneId: string,
    @Body() body: UpdateMilestoneDto,
  ) {
    return this.milestoneService.updateMilestone(orgId, projectId, milestoneId, body);
  }

  @Delete(":milestoneId")
  @RequirePermission("pm", "delete", "projectId")
  @ApiOperation({ summary: "Delete a milestone" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  @ApiParam({ name: "milestoneId" })
  @ApiResponse({ status: 200, description: "Milestone deleted" })
  deleteMilestone(
    @Param("orgId") orgId: string,
    @Param("projectId") projectId: string,
    @Param("milestoneId") milestoneId: string,
  ) {
    return this.milestoneService.deleteMilestone(orgId, projectId, milestoneId);
  }

  @Post(":milestoneId/tasks/:taskId")
  @RequirePermission("pm", "update", "projectId")
  @ApiOperation({ summary: "Add task to milestone" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  @ApiParam({ name: "milestoneId" })
  @ApiParam({ name: "taskId" })
  createMilestoneTask(
    @Param("orgId") orgId: string,
    @Param("projectId") projectId: string,
    @Param("milestoneId") milestoneId: string,
    @Param("taskId") taskId: string,
  ) {
    return this.milestoneService.createMilestoneTask(orgId, projectId, milestoneId, taskId);
  }

  @Delete(":milestoneId/tasks/:taskId")
  @RequirePermission("pm", "update", "projectId")
  @ApiOperation({ summary: "Remove task from milestone" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  @ApiParam({ name: "milestoneId" })
  @ApiParam({ name: "taskId" })
  deleteMilestoneTask(
    @Param("orgId") orgId: string,
    @Param("projectId") projectId: string,
    @Param("milestoneId") milestoneId: string,
    @Param("taskId") taskId: string,
  ) {
    return this.milestoneService.deleteMilestoneTask(orgId, projectId, milestoneId, taskId);
  }
}
