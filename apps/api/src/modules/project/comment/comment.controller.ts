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
import { CreateCommentDto, UpdateCommentDto } from "./dto";
import { CommentService } from "./comment.service";

@ApiTags("Comments")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/projects/:projectId/tasks/:taskId/comments")
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @RequirePermission("pm", "create")
  @ApiOperation({ summary: "Add a comment" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  @ApiParam({ name: "taskId" })
  createComment(
    @Param("orgId") orgId: string,
    @Param("projectId") projectId: string,
    @Param("taskId") taskId: string,
    @Body() body: CreateCommentDto,
    @CurrentMember() member: SessionMember,
  ) {
    return this.commentService.createComment(orgId, projectId, taskId, body, member.id);
  }

  @Get()
  @RequirePermission("pm", "read")
  @ApiOperation({ summary: "Get comments" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  @ApiParam({ name: "taskId" })
  getComments(
    @Param("orgId") orgId: string,
    @Param("projectId") projectId: string,
    @Param("taskId") taskId: string,
  ) {
    return this.commentService.getComments(orgId, projectId, taskId);
  }

  @Patch(":commentId")
  @RequirePermission("pm", "update", "taskId")
  @ApiOperation({ summary: "Edit a comment" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  @ApiParam({ name: "taskId" })
  @ApiParam({ name: "commentId" })
  updateComment(
    @Param("orgId") orgId: string,
    @Param("projectId") projectId: string,
    @Param("taskId") taskId: string,
    @Param("commentId") commentId: string,
    @Body() body: UpdateCommentDto,
  ) {
    return this.commentService.updateComment(orgId, projectId, taskId, commentId, body);
  }

  @Delete(":commentId")
  @RequirePermission("pm", "delete", "taskId")
  @ApiOperation({ summary: "Delete a comment" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "projectId" })
  @ApiParam({ name: "taskId" })
  @ApiParam({ name: "commentId" })
  @ApiResponse({ status: 200, description: "Comment deleted" })
  deleteComment(
    @Param("orgId") orgId: string,
    @Param("projectId") projectId: string,
    @Param("taskId") taskId: string,
    @Param("commentId") commentId: string,
  ) {
    return this.commentService.deleteComment(orgId, projectId, taskId, commentId);
  }
}
