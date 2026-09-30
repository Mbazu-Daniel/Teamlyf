import { Body, Controller, ForbiddenException, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../../common/better-auth/session.guard";
import type { SessionMember } from "../../../common/types";
import { CurrentMember, OrgMemberGuard, PermissionsGuard, RequirePermission } from "../../rbac";
import { CreateMentionDto } from "./dto/create-mention.dto";
import { MessageMentionsService } from "./message-mentions.service";

@ApiTags("Chat")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/message-mentions")
export class MessageMentionsController {
  constructor(private readonly mentions: MessageMentionsService) {}

  @Post()
  @RequirePermission("chat", "create")
  @ApiOperation({ summary: "Record an @-mention posted after a message was sent" })
  @ApiParam({ name: "orgId" })
  create(
    @Param("orgId") orgId: string,
    @Body() dto: CreateMentionDto,
    @CurrentMember() member: SessionMember,
  ) {
    return this.mentions.create(orgId, member.id, dto);
  }

  @Get("by-member/:memberId")
  @RequirePermission("chat", "read")
  @ApiOperation({ summary: "A member's mentions, newest first" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "memberId" })
  byMember(
    @Param("orgId") orgId: string,
    @Param("memberId") memberId: string,
    @CurrentMember() member: SessionMember,
  ) {
    if (member.id !== memberId) throw new ForbiddenException("You can only read your own mentions");
    return this.mentions.listByMember(orgId, memberId);
  }
}
