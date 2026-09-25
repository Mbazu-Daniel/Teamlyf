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
import { ReorderDto } from "../dto";
import { CreateTaskDto, UpdateTaskDto } from "./dto";
import { TaskService } from "./task.service";

@ApiTags("Tasks")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/projects/:projectId/tasks")
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @RequirePermission("pm", "create")
  @ApiOperation({ summary: "Create a task" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  createTask(
    @Param("orgId") orgId: string,
    @Param("projectId") projectId: string,
    @Body() body: CreateTaskDto,
    @CurrentMember() member: SessionMember,
  ) {
    return this.taskService.createTask(orgId, projectId, body, member.id);
  }

  @Get()
  @RequirePermission("pm", "read")
  @ApiOperation({ summary: "Get tasks" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  getTasks(@Param("orgId") orgId: string, @Param("projectId") projectId: string) {
    return this.taskService.getTasks(orgId, projectId);
  }

  @Get(":taskId/activity")
  @RequirePermission("pm", "read", "taskId")
  @ApiOperation({ summary: "Get task activity feed" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  @ApiParam({ name: "taskId" })
  getActivity(
    @Param("orgId") orgId: string,
    @Param("projectId") projectId: string,
    @Param("taskId") taskId: string,
  ) {
    return this.taskService.getActivity(orgId, projectId, taskId);
  }

  @Get(":taskId")
  @RequirePermission("pm", "read", "taskId")
  @ApiOperation({ summary: "Get a task" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  @ApiParam({ name: "taskId" })
  getTask(
    @Param("orgId") orgId: string,
    @Param("projectId") projectId: string,
    @Param("taskId") taskId: string,
  ) {
    return this.taskService.getTask(orgId, projectId, taskId);
  }

  @Patch("reorder")
  @RequirePermission("pm", "update", "projectId")
  @ApiOperation({ summary: "Reorder tasks; ids are ranked top-to-bottom" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  reorderTasks(
    @Param("orgId") orgId: string,
    @Param("projectId") projectId: string,
    @Body() body: ReorderDto,
  ) {
    return this.taskService.reorderTasks(orgId, projectId, body.ids);
  }

  @Patch(":taskId")
  @RequirePermission("pm", "update", "taskId")
  @ApiOperation({ summary: "Update a task" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  @ApiParam({ name: "taskId" })
  updateTask(
    @Param("orgId") orgId: string,
    @Param("projectId") projectId: string,
    @Param("taskId") taskId: string,
    @Body() body: UpdateTaskDto,
    @CurrentMember() member: SessionMember,
  ) {
    return this.taskService.updateTask(orgId, projectId, taskId, body, member.id);
  }

  @Delete(":taskId")
  @RequirePermission("pm", "delete", "taskId")
  @ApiOperation({ summary: "Delete a task" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  @ApiParam({ name: "taskId" })
  @ApiResponse({ status: 200, description: "Task deleted" })
  deleteTask(
    @Param("orgId") orgId: string,
    @Param("projectId") projectId: string,
    @Param("taskId") taskId: string,
  ) {
    return this.taskService.deleteTask(orgId, projectId, taskId);
  }
}
