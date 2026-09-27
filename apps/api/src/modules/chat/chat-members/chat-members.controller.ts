import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../../common/better-auth/session.guard";
import type { SessionMember } from "../../../common/types";
import { CurrentMember, OrgMemberGuard, PermissionsGuard, RequirePermission } from "../../rbac";
import { ChatMembersService } from "./chat-members.service";
import { ChatMembersQueryDto } from "./dto/chat-members-query.dto";

@ApiTags("Chat")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/chat")
export class ChatMembersController {
  constructor(private readonly members: ChatMembersService) {}

  @Get("members")
  @RequirePermission("chat", "read")
  @ApiOperation({ summary: "List the workspace members the chat UI renders" })
  @ApiParam({ name: "orgId" })
  list(@Param("orgId") orgId: string, @Query() query: ChatMembersQueryDto) {
    return this.members.list(orgId, query);
  }

  @Get("members/me")
  @RequirePermission("chat", "read")
  @ApiOperation({ summary: "The caller's own workspace member record" })
  @ApiParam({ name: "orgId" })
  me(@Param("orgId") orgId: string, @CurrentMember() member: SessionMember) {
    return this.members.me(orgId, member.id);
  }
}
