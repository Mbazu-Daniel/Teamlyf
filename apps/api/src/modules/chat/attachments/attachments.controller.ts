import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../../common/better-auth/session.guard";
import type { SessionMember } from "../../../common/types";
import { CurrentMember, OrgMemberGuard, PermissionsGuard, RequirePermission } from "../../rbac";
import { InitiateUploadDto } from "./dto/initiate-upload.dto";
import { MessageAttachmentsService } from "./message-attachments.service";

@ApiTags("Chat")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/attachments")
export class MessageAttachmentsController {
  constructor(private readonly attachments: MessageAttachmentsService) {}

  @Post("initiate")
  @RequirePermission("chat", "create")
  @ApiOperation({ summary: "Register a chat attachment and mint its upload URL" })
  @ApiParam({ name: "orgId" })
  initiate(
    @Param("orgId") orgId: string,
    @Body() dto: InitiateUploadDto,
    @CurrentMember() member: SessionMember,
  ) {
    return this.attachments.initiateUpload(orgId, member.id, dto);
  }
}
