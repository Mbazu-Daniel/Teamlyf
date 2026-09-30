import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../../common/better-auth/session.guard";
import { CurrentMember, OrgMemberGuard, PermissionsGuard, RequirePermission } from "../../rbac";
import type { SessionMember } from "../../../common/types";
import { AttachmentService } from "./attachment.service";
import { CreateAttachmentDto, InitiateAttachmentUploadDto } from "./dto";

@ApiTags("Attachments")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/projects/:projectId/tasks/:taskId/attachments")
export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  @Get()
  @RequirePermission("pm", "read", "taskId")
  @ApiOperation({ summary: "Get a task's attachments" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  @ApiParam({ name: "taskId" })
  getAttachments(
    @Param("orgId") orgId: string,
    @Param("projectId") projectId: string,
    @Param("taskId") taskId: string,
  ) {
    return this.attachmentService.getAttachments(orgId, projectId, taskId);
  }

  @Post("upload-url")
  @RequirePermission("pm", "create", "taskId")
  @ApiOperation({ summary: "Request a signed upload URL for a task attachment" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  @ApiParam({ name: "taskId" })
  requestUploadUrl(
    @Param("orgId") orgId: string,
    @Param("projectId") projectId: string,
    @Param("taskId") taskId: string,
    @Body() body: InitiateAttachmentUploadDto,
  ) {
    return this.attachmentService.createUploadUrl(orgId, projectId, taskId, body);
  }

  @Post()
  @RequirePermission("pm", "create", "taskId")
  @ApiOperation({ summary: "Record an attachment after a successful upload" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  @ApiParam({ name: "taskId" })
  createAttachment(
    @Param("orgId") orgId: string,
    @Param("projectId") projectId: string,
    @Param("taskId") taskId: string,
    @Body() body: CreateAttachmentDto,
    @CurrentMember() member: SessionMember,
  ) {
    return this.attachmentService.createAttachment(orgId, projectId, taskId, body, member.id);
  }

  @Get(":attachmentId/download-url")
  @RequirePermission("pm", "read", "taskId")
  @ApiOperation({ summary: "Get a signed download URL for an attachment" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  @ApiParam({ name: "taskId" })
  @ApiParam({ name: "attachmentId" })
  getDownloadUrl(
    @Param("orgId") orgId: string,
    @Param("projectId") projectId: string,
    @Param("taskId") taskId: string,
    @Param("attachmentId") attachmentId: string,
  ) {
    return this.attachmentService.createDownloadUrl(orgId, projectId, taskId, attachmentId);
  }

  @Delete(":attachmentId")
  @RequirePermission("pm", "delete", "taskId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete an attachment (uploader only)" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  @ApiParam({ name: "taskId" })
  @ApiParam({ name: "attachmentId" })
  @ApiResponse({ status: 204, description: "Attachment deleted" })
  deleteAttachment(
    @Param("orgId") orgId: string,
    @Param("projectId") projectId: string,
    @Param("taskId") taskId: string,
    @Param("attachmentId") attachmentId: string,
    @CurrentMember() member: SessionMember,
  ) {
    return this.attachmentService.deleteAttachment(
      orgId,
      projectId,
      taskId,
      attachmentId,
      member.id,
    );
  }
}
