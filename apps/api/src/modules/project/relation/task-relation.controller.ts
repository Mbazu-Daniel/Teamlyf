import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../../common/better-auth/session.guard";
import {
  CurrentMember,
  OrgMemberGuard,
  PermissionsGuard,
  RequirePermission,
} from "../../rbac";
import type { SessionMember } from "../../../common/types";
import { CreateTaskRelationDto } from "../task/dto";
import { TaskRelationService } from "./task-relation.service";

@ApiTags("Task Relations")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/projects/:projectId/tasks/:taskId/relations")
export class TaskRelationController {
  constructor(private readonly relationService: TaskRelationService) {}

  @Get()
  @RequirePermission("pm", "read", "taskId")
  @ApiOperation({ summary: "Get a task's relations (incoming and outgoing)" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  @ApiParam({ name: "taskId" })
  getRelations(
    @Param("orgId") orgId: string,
    @Param("projectId") projectId: string,
    @Param("taskId") taskId: string,
  ) {
    return this.relationService.getRelations(orgId, projectId, taskId);
  }

  @Post()
  @RequirePermission("pm", "create", "taskId")
  @ApiOperation({ summary: "Link this task to another task in the project" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  @ApiParam({ name: "taskId" })
  createRelation(
    @Param("orgId") orgId: string,
    @Param("projectId") projectId: string,
    @Param("taskId") taskId: string,
    @Body() body: CreateTaskRelationDto,
    @CurrentMember() member: SessionMember,
  ) {
    return this.relationService.createRelation(orgId, projectId, taskId, body, member.id);
  }

  @Delete(":relationId")
  @RequirePermission("pm", "delete", "taskId")
  @ApiOperation({ summary: "Remove a relation (either party may delete)" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  @ApiParam({ name: "taskId" })
  @ApiParam({ name: "relationId" })
  @ApiResponse({ status: 200, description: "Relation deleted" })
  deleteRelation(
    @Param("orgId") orgId: string,
    @Param("projectId") projectId: string,
    @Param("taskId") taskId: string,
    @Param("relationId") relationId: string,
    @CurrentMember() member: SessionMember,
  ) {
    return this.relationService.deleteRelation(orgId, projectId, taskId, relationId, member.id);
  }
}