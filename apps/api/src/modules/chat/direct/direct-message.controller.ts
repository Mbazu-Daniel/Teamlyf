import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../../common/better-auth/session.guard";
import { CurrentMember, OrgMemberGuard, PermissionsGuard, RequirePermission } from "../../rbac";
import type { SessionMember } from "../../../common/types";
import { CreateDirectMessageDto } from "./dto";
import { DirectMessageService } from "./direct-message.service";

@ApiTags("Direct Messages")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/direct-messages")
export class DirectMessageController {
  constructor(private readonly messages: DirectMessageService) {}
  @Get(":memberId") @RequirePermission("chat", "read") @ApiOperation({ summary: "List direct messages with a member" })
  list(@Param("orgId") orgId: string, @Param("memberId") otherMemberId: string, @CurrentMember() member: SessionMember) { return this.messages.list(orgId, member.id, otherMemberId); }
  @Post() @RequirePermission("chat", "create") @ApiOperation({ summary: "Send a direct message" })
  send(@Param("orgId") orgId: string, @Body() body: CreateDirectMessageDto, @CurrentMember() member: SessionMember) { return this.messages.send(orgId, member.id, body); }
  @Patch(":messageId/read") @RequirePermission("chat", "read") @ApiOperation({ summary: "Mark a direct message as read" })
  markRead(@Param("orgId") orgId: string, @Param("messageId") messageId: string, @CurrentMember() member: SessionMember) { return this.messages.markRead(orgId, member.id, messageId); }
}
