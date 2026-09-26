import { Body, Controller, MessageEvent, Param, Post, Sse, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { from } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { SessionGuard } from "../../common/better-auth/session.guard";
import { CurrentMember, OrgMemberGuard, PermissionsGuard, RequirePermission } from "../rbac";
import type { SessionMember } from "../../common/types";
import { AgentRuntimeService } from "./agent-runtime.service";
import { AgentMessageDto, ResolveAgentPermissionDto } from "./agent-runtime.dto";

@ApiTags("Agent Runtime")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/agents/runs/:runId")
export class AgentRuntimeController {
  constructor(private readonly runtime: AgentRuntimeService) {}

  @Sse("events")
  @RequirePermission("agents", "read")
  events(@Param("orgId") organizationId: string, @Param("runId") runId: string, @CurrentMember() member: SessionMember) {
    return this.runtime.streamEvents(organizationId, runId, member.id).then((stream) =>
      stream.pipe(map((event): MessageEvent => ({
        id: event.id,
        type: event.type,
        data: event,
      }))),
    );
  }

  @Post("messages")
  @RequirePermission("agents", "create")
  async message(
    @Param("orgId") organizationId: string,
    @Param("runId") runId: string,
    @CurrentMember() member: SessionMember,
    @Body() body: AgentMessageDto,
  ) {
    await this.runtime.sendMessage(organizationId, runId, member.id, body.message);
    return { runId, accepted: true };
  }

  @Post("interrupt")
  @RequirePermission("agents", "update")
  interrupt(
    @Param("orgId") organizationId: string,
    @Param("runId") runId: string,
    @CurrentMember() member: SessionMember,
  ) {
    return this.runtime.interrupt(organizationId, runId, member.id);
  }

  @Post("resume")
  @RequirePermission("agents", "update")
  resume(
    @Param("orgId") organizationId: string,
    @Param("runId") runId: string,
    @CurrentMember() member: SessionMember,
  ) {
    return this.runtime.resume(organizationId, runId, member.id);
  }

  @Post("permissions/:requestId")
  @RequirePermission("agents", "update")
  resolvePermission(
    @Param("orgId") organizationId: string,
    @Param("runId") runId: string,
    @Param("requestId") requestId: string,
    @CurrentMember() member: SessionMember,
    @Body() body: ResolveAgentPermissionDto,
  ) {
    return this.runtime.resolvePermission(organizationId, runId, member.id, requestId, body.decision);
  }
}
