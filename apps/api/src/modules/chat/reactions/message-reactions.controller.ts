import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../../common/better-auth/session.guard";
import { CurrentMember, OrgMemberGuard, PermissionsGuard, RequirePermission } from "../../rbac";
import type { SessionMember } from "../../../common/types";
import { MessageReactionsQueryDto } from "./dto/by-message-query.dto";
import { MessageReactionsService } from "./message-reactions.service";

@ApiTags("Chat")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/message-reactions")
export class MessageReactionsController {
  constructor(private readonly reactions: MessageReactionsService) {}

  /** Literal route first: never let a later `:something` shadow `by-message`. */
  @Get("by-message")
  @RequirePermission("chat", "read")
  @ApiOperation({ summary: "Everyone's reactions on one message" })
  @ApiParam({ name: "orgId" })
  byMessage(@Param("orgId") orgId: string, @Query() query: MessageReactionsQueryDto, @CurrentMember() member: SessionMember) {
    return this.reactions.listByMessage(orgId, query.messageId, query.messageType, member.id);
  }
}
