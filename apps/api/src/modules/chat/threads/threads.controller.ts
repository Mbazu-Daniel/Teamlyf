import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../../common/better-auth/session.guard";
import type { SessionMember } from "../../../common/types";
import { CurrentMember, OrgMemberGuard, PermissionsGuard, RequirePermission } from "../../rbac";
import { ThreadsQueryDto } from "./dto/threads-query.dto";
import { ThreadsService } from "./threads.service";

@ApiTags("Chat")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/chat")
export class ThreadsController {
  constructor(private readonly threads: ThreadsService) {}

  @Get("threads")
  @RequirePermission("chat", "read")
  @ApiOperation({
    summary: "Threads the caller takes part in, across channels and direct messages",
  })
  @ApiParam({ name: "orgId" })
  list(
    @Param("orgId") orgId: string,
    @CurrentMember() member: SessionMember,
    @Query() query: ThreadsQueryDto,
  ) {
    return this.threads.getUnifiedThreads(orgId, member.id, query);
  }
}
