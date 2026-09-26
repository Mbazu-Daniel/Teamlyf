import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../../common/better-auth/session.guard";
import { CurrentMember, OrgMemberGuard, PermissionsGuard, RequirePermission } from "../../rbac";
import type { SessionMember } from "../../../common/types";
import { ReorderDto } from "../dto";
import { CreateTaskDto, UpdateTaskDto } from "./dto";
import { TaskOperationService } from "./task-operation.service";
import { TaskService } from "./task.service";

@ApiTags("Tasks")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/projects/:projectId/tasks")
export class TaskController {
  constructor(private readonly taskService: TaskService, private readonly taskOperations: TaskOperationService) {}

  @Post()
  @RequirePermission("pm", "create")
  @ApiOperation({ summary: "Create a task" })
  createTask(@Param("orgId") orgId: string, @Param("projectId") projectId: string, @Body() body: CreateTaskDto, @CurrentMember() member: SessionMember) { return this.taskService.createTask(orgId, projectId, body, member.id); }

  @Get()
  @RequirePermission("pm", "read")
  @ApiOperation({ summary: "Get tasks" })
  getTasks(@Param("orgId") orgId: string, @Param("projectId") projectId: string) { return this.taskService.getTasks(orgId, projectId); }

  @Get(":taskId/activity")
  @RequirePermission("pm", "read", "taskId")
  @ApiOperation({ summary: "Get task activity feed" })
  getActivity(@Param("orgId") orgId: string, @Param("projectId") projectId: string, @Param("taskId") taskId: string) { return this.taskService.getActivity(orgId, projectId, taskId); }

  @Get(":taskId")
  @RequirePermission("pm", "read", "taskId")
  @ApiOperation({ summary: "Get a task" })
  getTask(@Param("orgId") orgId: string, @Param("projectId") projectId: string, @Param("taskId") taskId: string) { return this.taskService.getTask(orgId, projectId, taskId); }

  @Patch("reorder")
  @RequirePermission("pm", "update", "projectId")
  @ApiOperation({ summary: "Reorder tasks; ids are ranked top-to-bottom" })
  reorderTasks(@Param("orgId") orgId: string, @Param("projectId") projectId: string, @Body() body: ReorderDto) { return this.taskService.reorderTasks(orgId, projectId, body.ids); }

  @Patch(":taskId/status")
  @RequirePermission("pm", "update", "taskId")
  @ApiOperation({ summary: "Update task status" })
  updateTaskStatus(@Param("orgId") orgId: string, @Param("projectId") projectId: string, @Param("taskId") taskId: string, @Body("statusId") statusId: string, @CurrentMember() member: SessionMember) { return this.taskOperations.updateStatus(orgId, projectId, taskId, statusId, member.id); }

  @Patch(":taskId/assign")
  @RequirePermission("pm", "update", "taskId")
  @ApiOperation({ summary: "Assign task to an organization member" })
  assignTask(@Param("orgId") orgId: string, @Param("projectId") projectId: string, @Param("taskId") taskId: string, @Body("memberId") memberId: string, @CurrentMember() member: SessionMember) { return this.taskOperations.assign(orgId, projectId, taskId, memberId, member.id); }

  @Patch(":taskId")
  @RequirePermission("pm", "update", "taskId")
  @ApiOperation({ summary: "Update a task" })
  updateTask(@Param("orgId") orgId: string, @Param("projectId") projectId: string, @Param("taskId") taskId: string, @Body() body: UpdateTaskDto, @CurrentMember() member: SessionMember) { return this.taskService.updateTask(orgId, projectId, taskId, body, member.id); }

  @Delete(":taskId")
  @RequirePermission("pm", "delete", "taskId")
  @ApiResponse({ status: 200, description: "Task deleted" })
  deleteTask(@Param("orgId") orgId: string, @Param("projectId") projectId: string, @Param("taskId") taskId: string) { return this.taskService.deleteTask(orgId, projectId, taskId); }
}
