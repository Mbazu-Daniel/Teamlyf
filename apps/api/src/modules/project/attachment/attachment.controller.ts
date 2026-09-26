import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../../common/better-auth/session.guard";
import { CurrentMember, OrgMemberGuard, PermissionsGuard, RequirePermission } from "../../rbac";
import type { SessionMember } from "../../../common/types";
import { CreateTaskAttachmentDto } from "./dto";
import { AttachmentService } from "./attachment.service";

@ApiTags("Task Attachments")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/projects/:projectId/tasks/:taskId/attachments")
export class AttachmentController {
  constructor(private readonly attachments: AttachmentService) {}
  @Get() @RequirePermission("pm", "read", "taskId") @ApiOperation({ summary: "List task attachments" })
  list(@Param("orgId") orgId: string, @Param("projectId") projectId: string, @Param("taskId") taskId: string) { return this.attachments.list(orgId, projectId, taskId); }
  @Post() @RequirePermission("pm", "update", "taskId") @ApiOperation({ summary: "Register a task attachment" })
  create(@Param("orgId") orgId: string, @Param("projectId") projectId: string, @Param("taskId") taskId: string, @Body() body: CreateTaskAttachmentDto, @CurrentMember() member: SessionMember) { return this.attachments.create(orgId, projectId, taskId, member.id, body); }
  @Delete(":attachmentId") @RequirePermission("pm", "update", "taskId") @ApiOperation({ summary: "Remove a task attachment" })
  remove(@Param("orgId") orgId: string, @Param("projectId") projectId: string, @Param("taskId") taskId: string, @Param("attachmentId") attachmentId: string) { return this.attachments.remove(orgId, projectId, taskId, attachmentId); }
}
