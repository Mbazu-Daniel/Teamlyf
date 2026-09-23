import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { createCipheriv, createHash, randomBytes } from "node:crypto";
import type { Database } from "@teamlyf/db";
import { agent, agentRun, aiProviderConfig, aiUsage, billingSchema } from "@teamlyf/db";

const { subscription } = billingSchema;
import { and, count, eq } from "drizzle-orm";
import { API_ENV } from "../../common/config/env.module";
import type { ApiEnv } from "../../common/config/env";
import { DATABASE } from "../../common/db/db.provider";
import type { SessionMember } from "../../common/types";
import type { CreateAgentDto, CreateAgentRunDto, RecordUsageDto, UpdateAgentDto, UpsertProviderConfigDto } from "./agent.dto";
import { planEntitlements, type BillingPlan } from "../billing/plan-entitlements";

@Injectable()
export class AgentService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(API_ENV) private readonly env: ApiEnv,
  ) {}

  async list(organizationId: string) {
    return this.db.query.agent.findMany({
      where: eq(agent.organizationId, organizationId),
      orderBy: (table, { asc }) => asc(table.createdAt),
    });
  }

  async create(organizationId: string, dto: CreateAgentDto) {
    await this.assertAgentCapacity(organizationId);
    const [created] = await this.db.insert(agent).values({
      organizationId,
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
    }).returning();
    return created;
  }

  async update(organizationId: string, agentId: string, dto: UpdateAgentDto) {
    await this.requireAgent(organizationId, agentId);
    const [updated] = await this.db.update(agent).set(this.buildUpdateValues(dto)).where(
      and(eq(agent.organizationId, organizationId), eq(agent.id, agentId)),
    ).returning();
    return updated;
  }

  async createRun(
    organizationId: string,
    member: SessionMember,
    agentId: string,
    dto: CreateAgentRunDto,
  ) {
    const target = await this.requireAgent(organizationId, agentId);
    if (!target.enabled) throw new ForbiddenException("Agent is disabled");

    const [run] = await this.db.insert(agentRun).values({
      organizationId,
      agentId,
      memberId: member.id,
      input: dto.input === undefined ? null : dto.input,
    }).returning();

    return run;
  }

  async listRuns(organizationId: string, agentId: string) {
    await this.requireAgent(organizationId, agentId);
    return this.db.query.agentRun.findMany({
      where: and(eq(agentRun.organizationId, organizationId), eq(agentRun.agentId, agentId)),
      orderBy: (table, { desc }) => desc(table.createdAt),
      limit: 100,
    });
  }

  async listUsage(organizationId: string, memberId: string) {
    return this.db.query.aiUsage.findMany({
      where: and(eq(aiUsage.organizationId, organizationId), eq(aiUsage.memberId, memberId)),
      orderBy: (table, { desc }) => desc(table.createdAt),
      limit: 100,
    });
  }

  async upsertProviderConfig(organizationId: string, dto: UpsertProviderConfigDto) {
    this.validateProviderConfig(dto);
    const encryptedApiKey = this.encryptOptionalApiKey(dto.apiKey);
    const [config] = await this.saveProviderConfig(organizationId, dto, encryptedApiKey);

    return {
      id: config.id,
      organizationId: config.organizationId,
      provider: config.provider,
      model: config.model,
      source: config.source,
      isActive: config.isActive,
    };
  }

  async listProviderConfigs(organizationId: string) {
    return this.db.query.aiProviderConfig.findMany({
      where: eq(aiProviderConfig.organizationId, organizationId),
      columns: {
        id: true,
        organizationId: true,
        provider: true,
        model: true,
        source: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: (table, { desc }) => desc(table.createdAt),
    });
  }

  async recordUsage(
    organizationId: string,
    memberId: string,
    dto: RecordUsageDto,
  ) {
    await this.requireAgent(organizationId, dto.agentId);
    const totalTokens = dto.inputTokens + dto.outputTokens;
    const allowanceConsumed = dto.source === "teamlyf" ? totalTokens : 0;

    const [usage] = await this.db.insert(aiUsage).values({
      organizationId,
      memberId,
      agentId: dto.agentId,
      provider: dto.provider.trim(),
      model: dto.model.trim(),
      source: dto.source,
      inputTokens: dto.inputTokens,
      outputTokens: dto.outputTokens,
      totalTokens,
      estimatedCostUsd: dto.estimatedCostUsd ?? null,
      allowanceConsumed,
    }).returning();

    return usage;
  }

  private buildUpdateValues(dto: UpdateAgentDto) {
    const values: Record<string, unknown> = { updatedAt: new Date() };
    const fields = [
      ["name", dto.name?.trim()],
      ["description", dto.description?.trim() || null],
      ["enabled", dto.enabled],
    ] as const;

    for (const [key, value] of fields) {
      if (value !== undefined) values[key] = value;
    }
    return values;
  }

  private validateProviderConfig(dto: UpsertProviderConfigDto) {
    if (dto.source === "byok") {
      this.requireApiKey(dto.apiKey);
      return;
    }
    if (dto.source === "teamlyf" && dto.apiKey) {
      throw new BadRequestException("Teamlyf-managed providers do not accept organization API keys");
    }
  }

  private requireApiKey(apiKey?: string) {
    if (!apiKey) {
      throw new BadRequestException("BYOK provider configuration requires an API key");
    }
  }

  private encryptOptionalApiKey(apiKey?: string): string | null {
    return apiKey ? this.encrypt(apiKey) : null;
  }

  private async saveProviderConfig(
    organizationId: string,
    dto: UpsertProviderConfigDto,
    encryptedApiKey: string | null,
  ) {
    const keyVersion = encryptedApiKey ? "v1" : null;
    return this.db.insert(aiProviderConfig).values({
      organizationId,
      provider: dto.provider.trim(),
      model: dto.model.trim(),
      source: dto.source,
      encryptedApiKey,
      keyVersion,
    }).onConflictDoUpdate({
      target: [
        aiProviderConfig.organizationId,
        aiProviderConfig.source,
        aiProviderConfig.provider,
        aiProviderConfig.model,
      ],
      set: { encryptedApiKey, keyVersion, isActive: true, updatedAt: new Date() },
    }).returning();
  }

  private async requireAgent(organizationId: string, agentId: string) {
    const found = await this.db.query.agent.findFirst({
      where: and(eq(agent.organizationId, organizationId), eq(agent.id, agentId)),
    });
    if (!found) throw new NotFoundException("Agent not found");
    return found;
  }

  private async assertAgentCapacity(organizationId: string) {
    const [currentSubscription, result] = await Promise.all([
      this.db.query.subscription.findFirst({
        where: eq(subscription.organizationId, organizationId),
      }),
      this.db.select({ total: count() }).from(agent).where(eq(agent.organizationId, organizationId)),
    ]);

    const limit = this.resolveAgentLimit(currentSubscription);
    if (Number(result[0]?.total ?? 0) >= limit) {
      throw new ForbiddenException("Agent limit reached for the organization plan");
    }
  }

  private resolveAgentLimit(subscription?: { plan: string }): number {
    const plan = subscription?.plan as BillingPlan | undefined;
    return planEntitlements[plan ?? "starter"].agentLimit;
  }

  private encrypt(value: string): string {
    const secret = this.env.AGENT_ENCRYPTION_SECRET;
    if (!secret) throw new BadRequestException("Agent encryption is not configured");
    const key = createHash("sha256").update(secret).digest();
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(":");
  }
}
