import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../common/better-auth/session.guard";
import type { SessionMember } from "../../common/types";
import { CurrentMember, OrgMemberGuard, PermissionsGuard, RequirePermission } from "../rbac";
import { FeatureGateGuard, RequireFeature } from "../billing/feature-gate";
import {
  CreateAgentDto,
  CreateAgentRunDto,
  RecordUsageDto,
  UpdateAgentDto,
  UpsertProviderConfigDto,
} from "./agent.dto";
import { AgentService } from "./agent.service";

@ApiTags("Agents")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard, FeatureGateGuard)
@RequireFeature("agents")
@Controller("organization/:orgId/agents")
export class AgentController {
  constructor(private readonly agents: AgentService) {}

  @Get()
  @RequirePermission("agents", "read")
  list(@Param("orgId") organizationId: string) {
    return this.agents.list(organizationId);
  }

  @Post()
  @RequirePermission("agents", "create")
  create(@Param("orgId") organizationId: string, @Body() body: CreateAgentDto) {
    return this.agents.create(organizationId, body);
  }

  @Patch(":agentId")
  @RequirePermission("agents", "update")
  update(
    @Param("orgId") organizationId: string,
    @Param("agentId") agentId: string,
    @Body() body: UpdateAgentDto,
  ) {
    return this.agents.update(organizationId, agentId, body);
  }

  @Post(":agentId/runs")
  @RequirePermission("agents", "create")
  run(
    @Param("orgId") organizationId: string,
    @Param("agentId") agentId: string,
    @CurrentMember() member: SessionMember,
    @Body() body: CreateAgentRunDto,
  ) {
    return this.agents.createRun(organizationId, member, agentId, body);
  }

  @Get(":agentId/runs")
  @RequirePermission("agents", "read")
  runs(@Param("orgId") organizationId: string, @Param("agentId") agentId: string) {
    return this.agents.listRuns(organizationId, agentId);
  }

  @Get("provider-configs")
  @RequirePermission("agents", "read")
  providers(@Param("orgId") organizationId: string) {
    return this.agents.listProviderConfigs(organizationId);
  }

  @Post("provider-configs")
  @RequirePermission("agents", "update")
  configureProvider(
    @Param("orgId") organizationId: string,
    @Body() body: UpsertProviderConfigDto,
  ) {
    return this.agents.upsertProviderConfig(organizationId, body);
  }

  @Get("usage")
  @RequirePermission("agents", "read")
  usage(
    @Param("orgId") organizationId: string,
    @CurrentMember() member: SessionMember,
  ) {
    return this.agents.listUsage(organizationId, member.id);
  }

  @Post("usage")
  @RequirePermission("agents", "update")
  recordUsage(
    @Param("orgId") organizationId: string,
    @CurrentMember() member: SessionMember,
    @Body() body: RecordUsageDto,
  ) {
    return this.agents.recordUsage(organizationId, member.id, body);
  }
}