import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../common/better-auth/session.guard";
import type { SessionMember } from "../../common/types";
import { CurrentMember, OrgMemberGuard, PermissionsGuard, RequirePermission } from "../rbac";
import { ConfirmRecordingDto, CreateCallTokenDto, InitiateRecordingDto } from "./call.dto";
import { CallRecordingService } from "./call-recording.service";
import { CallsService } from "./calls.service";

@ApiTags("Calls")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/calls")
export class CallsController {
  constructor(
    private readonly calls: CallsService,
    private readonly recordings: CallRecordingService,
  ) {}

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

  @Post(":callId/recording/upload-url")
  @RequirePermission("chat", "create")
  initiateRecording(
    @Param("orgId") orgId: string,
    @Param("callId") callId: string,
    @CurrentMember() member: SessionMember,
    @Body() body: InitiateRecordingDto,
  ) {
    return this.recordings.initiateUpload(orgId, callId, member.id, body);
  }

  @Post(":callId/recording")
  @RequirePermission("chat", "create")
  confirmRecording(
    @Param("orgId") orgId: string,
    @Param("callId") callId: string,
    @CurrentMember() member: SessionMember,
    @Body() body: ConfirmRecordingDto,
  ) {
    return this.recordings.confirmUpload(orgId, callId, member.id, body.fileKey);
  }

  @Get(":callId/recording")
  @RequirePermission("chat", "read")
  getRecording(
    @Param("orgId") orgId: string,
    @Param("callId") callId: string,
    @CurrentMember() member: SessionMember,
  ) {
    return this.recordings.getPlaybackUrl(orgId, callId, member.id);
  }

  @Post(":callId/join")
  @RequirePermission("chat", "create")
  join(
    @Param("orgId") orgId: string,
    @Param("callId") callId: string,
    @CurrentMember() member: SessionMember,
  ) {
    return this.calls.join(callId, orgId, member.id);
  }
}
