import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../common/better-auth/session.guard";
import type { SessionMember } from "../../common/types";
import { CurrentMember, OrgMemberGuard, PermissionsGuard, RequirePermission } from "../rbac";
import { CallService } from "./call.service";
import { CreateCallTokenDto } from "./call.dto";

@ApiTags("Calls")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/calls")
export class CallController {
  constructor(private readonly calls: CallService) {}

  @Post("token")
  @RequirePermission("chat", "create")
  token(@Param("orgId") orgId: string, @CurrentMember() member: SessionMember, @Body() body: CreateCallTokenDto) {
    return this.calls.issueToken(orgId, member.id, body.roomName, body.participantName);
  }
}
