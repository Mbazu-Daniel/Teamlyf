import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { Database } from "@teamlyf/db";
import { agent, agentAuditLog, agentCredential, agentTask } from "@teamlyf/db/workspace-schema";
import { and, eq } from "drizzle-orm";
import { DATABASE } from "../../common/db/db.provider";
import { TenantScopedRepository } from "../../common/db/tenant-scoped.repository";
import { API_ENV } from "../../common/config/env.module";
import type { ApiEnv } from "../../common/config/env";
import { AgentQueueService } from "./agent-queue.service";
import type { AssignAgentTaskDto, CreateAgentDto, CredentialDto, UpdateAgentDto } from "./dto";

@Injectable()
export class AgentService extends TenantScopedRepository {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(API_ENV) private readonly env: ApiEnv,
    private readonly queue: AgentQueueService,
  ) { super(); }

  list(organizationId: string) {
    return this.db.query.agent.findMany({ where: eq(agent.organizationId, this.assertOrganizationId(organizationId)) });
  }

  listTasks(organizationId: string) {
    return this.db.query.agentTask.findMany({ where: eq(agentTask.organizationId, this.assertOrganizationId(organizationId)), orderBy: (t, { desc }) => [desc(t.createdAt)] });
  }

  async audit(organizationId: string, agentId: string) {
    this.requireScoped(await this.db.query.agent.findFirst({ where: and(eq(agent.id, agentId), eq(agent.organizationId, this.assertOrganizationId(organizationId))) }), "Agent");
    return this.db.query.agentAuditLog.findMany({ where: and(eq(agentAuditLog.organizationId, organizationId), eq(agentAuditLog.agentId, agentId)), orderBy: (item, { desc }) => [desc(item.createdAt)] });
  }

  async create(organizationId: string, dto: CreateAgentDto) {
    const [created] = await this.db.insert(agent).values({
      organizationId: this.assertOrganizationId(organizationId), name: dto.name,
      capabilityType: dto.capabilityType, toolGrants: JSON.stringify(dto.toolGrants ?? []),
    }).returning();
    return created;
  }

  async update(organizationId: string, agentId: string, dto: UpdateAgentDto) {
    this.requireScoped(await this.db.query.agent.findFirst({ where: and(eq(agent.id, agentId), eq(agent.organizationId, this.assertOrganizationId(organizationId))) }), "Agent");
    const [updated] = await this.db.update(agent).set({ ...dto, toolGrants: dto.toolGrants ? JSON.stringify(dto.toolGrants) : undefined, updatedAt: new Date() }).where(and(eq(agent.id, agentId), eq(agent.organizationId, organizationId))).returning();
    return updated;
  }

  async assign(organizationId: string, dto: AssignAgentTaskDto) {
    const foundAgent = await this.db.query.agent.findFirst({
      where: and(eq(agent.organizationId, this.assertOrganizationId(organizationId)), eq(agent.id, dto.agentId)),
    });
    const ownedAgent = this.requireScoped(foundAgent, "Agent");
    if (ownedAgent.status !== "active") throw new BadRequestException("Agent is not active");
    const [created] = await this.db.insert(agentTask).values({
      organizationId, agentId: dto.agentId, sourceType: dto.sourceType, sourceId: dto.sourceId,
      input: JSON.stringify(dto.input ?? {}),
    }).returning();
    await this.queue.enqueue({ id: created.id, organizationId, agentId: dto.agentId, sourceType: dto.sourceType, sourceId: dto.sourceId, input: dto.input ?? {} });
    return created;
  }

  async storeCredential(organizationId: string, agentId: string, dto: CredentialDto) {
    const foundAgent = await this.db.query.agent.findFirst({ where: and(eq(agent.organizationId, organizationId), eq(agent.id, agentId)) });
    this.requireScoped(foundAgent, "Agent");
    const encrypted = this.encrypt(dto.value);
    await this.db.insert(agentCredential).values({ organizationId, agentId, provider: dto.provider, ...encrypted });
    return { stored: true, provider: dto.provider };
  }

  async resolveApproval(organizationId: string, taskId: string, approved: boolean) {
    const pending = this.requireScoped(await this.db.query.agentTask.findFirst({ where: and(eq(agentTask.id, taskId), eq(agentTask.organizationId, organizationId), eq(agentTask.status, "awaiting_approval")) }), "Pending agent task");
    const [updated] = await this.db.update(agentTask).set({ approvalStatus: approved ? "approved" : "rejected", status: approved ? "completed" : "cancelled", completedAt: new Date() }).where(eq(agentTask.id, pending.id)).returning();
    await this.db.insert(agentAuditLog).values({ organizationId, agentId: pending.agentId, agentTaskId: pending.id, action: "approval.resolve", input: JSON.stringify({ approved }) });
    return updated;
  }

  decryptCredential(value: { cipherText: string; iv: string; authTag: string }): string {
    const key = this.key();
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(value.iv, "base64"));
    decipher.setAuthTag(Buffer.from(value.authTag, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(value.cipherText, "base64")), decipher.final()]).toString("utf8");
  }

  private encrypt(value: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key(), iv);
    const cipherText = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    return { cipherText: cipherText.toString("base64"), iv: iv.toString("base64"), authTag: cipher.getAuthTag().toString("base64") };
  }

  private key(): Buffer {
    if (!this.env.AGENT_ENCRYPTION_KEY) throw new BadRequestException("AGENT_ENCRYPTION_KEY is required to store credentials");
    return createHash("sha256").update(this.env.AGENT_ENCRYPTION_KEY).digest();
  }
}
