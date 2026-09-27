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
import { CreateTaskSubscriberDto } from "../task/dto";
import { TaskSubscriberService } from "./task-subscriber.service";

@ApiTags("Task Subscribers")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/projects/:projectId/tasks/:taskId/subscribers")
export class TaskSubscriberController {
  constructor(private readonly subscriberService: TaskSubscriberService) {}

  @Get()
  @RequirePermission("pm", "read", "taskId")
  @ApiOperation({ summary: "Get a task's subscribers" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  @ApiParam({ name: "taskId" })
  getSubscribers(
    @Param("orgId") orgId: string,
    @Param("projectId") projectId: string,
    @Param("taskId") taskId: string,
  ) {
    return this.subscriberService.getSubscribers(orgId, projectId, taskId);
  }

  @Post()
  @RequirePermission("pm", "create", "taskId")
  @ApiOperation({ summary: "Subscribe a member to a task (or update preferences)" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  @ApiParam({ name: "taskId" })
  subscribe(
    @Param("orgId") orgId: string,
    @Param("projectId") projectId: string,
    @Param("taskId") taskId: string,
    @Body() body: CreateTaskSubscriberDto,
    @CurrentMember() member: SessionMember,
  ) {
    return this.subscriberService.subscribe(orgId, projectId, taskId, body, member.id);
  }

  @Delete(":subscriberMemberId")
  @RequirePermission("pm", "delete", "taskId")
  @ApiOperation({ summary: "Unsubscribe a member from a task" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  @ApiParam({ name: "taskId" })
  @ApiParam({ name: "subscriberMemberId" })
  @ApiResponse({ status: 200, description: "Subscriber removed" })
  unsubscribe(
    @Param("orgId") orgId: string,
    @Param("projectId") projectId: string,
    @Param("taskId") taskId: string,
    @Param("subscriberMemberId") subscriberMemberId: string,
    @CurrentMember() member: SessionMember,
  ) {
    return this.subscriberService.unsubscribe(
      orgId,
      projectId,
      taskId,
      subscriberMemberId,
      member.id,
    );
  }
}