import { Body, Controller, Get, Param, Patch, Post, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../common/better-auth/session.guard";
import { OrgMemberGuard, PermissionsGuard, RequirePermission } from "../rbac";
import { AgentService } from "./agent.service";
import { FeatureGateGuard, RequireFeature } from "../billing/feature-gate";
import { ApprovalDto, AssignAgentTaskDto, CreateAgentDto, CredentialDto, UpdateAgentDto } from "./dto";

@ApiTags("Agents")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard, FeatureGateGuard)
@RequireFeature("agents")
@Controller("organization/:orgId/agents")
export class AgentController {
  constructor(private readonly agents: AgentService) {}
  @Get() @RequirePermission("agents", "read") list(@Param("orgId") orgId: string) { return this.agents.list(orgId); }
  @Get("tasks") @RequirePermission("agents", "read") tasks(@Param("orgId") orgId: string) { return this.agents.listTasks(orgId); }
  @Get(":agentId/audit") @RequirePermission("agents", "read") audit(@Param("orgId") orgId: string, @Param("agentId") agentId: string) { return this.agents.audit(orgId, agentId); }
  @Post() @RequirePermission("agents", "create") create(@Param("orgId") orgId: string, @Body() body: CreateAgentDto) { return this.agents.create(orgId, body); }
  @Patch(":agentId") @RequirePermission("agents", "update") update(@Param("orgId") orgId: string, @Param("agentId") agentId: string, @Body() body: UpdateAgentDto) { return this.agents.update(orgId, agentId, body); }
  @Post("tasks") @RequirePermission("agents", "create") assign(@Param("orgId") orgId: string, @Body() body: AssignAgentTaskDto) { return this.agents.assign(orgId, body); }
  @Post("tasks/:taskId/approval") @RequirePermission("agents", "update") approval(@Param("orgId") orgId: string, @Param("taskId") taskId: string, @Body() body: ApprovalDto) { return this.agents.resolveApproval(orgId, taskId, body.approved); }
  @Put(":agentId/credentials") @RequirePermission("agents", "update") credential(@Param("orgId") orgId: string, @Param("agentId") agentId: string, @Body() body: CredentialDto) { return this.agents.storeCredential(orgId, agentId, body); }
}
