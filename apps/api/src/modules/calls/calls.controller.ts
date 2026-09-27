import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../common/better-auth/session.guard";
import type { SessionMember } from "../../common/types";
import { CurrentMember, OrgMemberGuard, PermissionsGuard, RequirePermission } from "../rbac";
import { CreateCallTokenDto } from "./call.dto";
import { CallsService } from "./calls.service";

@ApiTags("Calls")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/calls")
export class CallsController {
  constructor(private readonly calls: CallsService) {}

  @Get("history")
  @RequirePermission("chat", "read")
  history(@Param("orgId") orgId: string, @CurrentMember() member: SessionMember) {
    return this.calls.getHistory(orgId, member.id);
  }

  @Get("missed")
  @RequirePermission("chat", "read")
  missed(@Param("orgId") orgId: string, @CurrentMember() member: SessionMember) {
    return this.calls.getMissedCalls(orgId, member.id);
  }

  @Post("token")
  @RequirePermission("chat", "create")
  token(
    @Param("orgId") orgId: string,
    @CurrentMember() member: SessionMember,
    @Body() body: CreateCallTokenDto,
  ) {
    return this.calls.issueToken(orgId, member.id, body.roomName, body.participantName);
  }

  @Post(":callId/join")
  @RequirePermission("chat", "create")
  join(@Param("orgId") orgId: string, @Param("callId") callId: string, @CurrentMember() member: SessionMember) {
    return this.calls.join(callId, orgId, member.id);
  }
}
