import { BadRequestException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Database } from "@teamlyf/db";
import { member, organization } from "@teamlyf/db/organization-schema";
import { subscription } from "@teamlyf/db/billing-schema";
import { count, eq } from "drizzle-orm";
import { API_ENV } from "../../common/config/env.module";
import type { ApiEnv } from "../../common/config/env";
import { DATABASE } from "../../common/db/db.provider";
import type { BillingPlan, CheckoutDto } from "./billing.dto";
import { planEntitlements } from "./plan-entitlements";

type BillingEvent = {
  id?: string;
  type?: string;
  data?: {
    organizationId?: string;
    customerId?: string;
    subscriptionId?: string;
    plan?: string;
    status?: string;
    seatLimit?: number;
    agentLimit?: number;
    currentPeriodEnd?: string;
  };
};

@Injectable()
export class BillingService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(API_ENV) private readonly env: ApiEnv,
  ) {}

  async summary(organizationId: string) {
    await this.requireOrganization(organizationId);
    const [current, members] = await Promise.all([
      this.findSubscription(organizationId),
      this.countMembers(organizationId),
    ]);
    return this.buildSummary(current, members);
  }

  private findSubscription(organizationId: string) {
    return this.db.query.subscription.findFirst({
      where: eq(subscription.organizationId, organizationId),
    });
  }

  private countMembers(organizationId: string) {
    return this.db
      .select({ total: count() })
      .from(member)
      .where(eq(member.organizationId, organizationId));
  }

  private buildSummary(
    current: Awaited<ReturnType<BillingService["findSubscription"]>>,
    members: Array<{ total: number }>,
  ) {
    return {
      plan: this.subscriptionPlan(current),
      status: this.subscriptionStatus(current),
      seatLimit: this.seatLimit(current),
      agentLimit: this.agentLimit(current),
      currentPeriodEnd: this.periodEnd(current?.currentPeriodEnd),
      members: this.memberCount(members),
      provider: this.provider(current),
      hasSubscription: this.hasSubscription(current),
    };
  }

  private subscriptionStatus(current: Awaited<ReturnType<BillingService["findSubscription"]>>) {
    if (current?.status) return current.status;
    return "inactive";
  }

  private seatLimit(current: Awaited<ReturnType<BillingService["findSubscription"]>>) {
    return this.subscriptionLimit(current?.seatLimit, current?.plan, "seatLimit");
  }

  private agentLimit(current: Awaited<ReturnType<BillingService["findSubscription"]>>) {
    return this.subscriptionLimit(current?.agentLimit, current?.plan, "agentLimit");
  }

  private provider(current: Awaited<ReturnType<BillingService["findSubscription"]>>) {
    if (current?.provider) return current.provider;
    return "bachs";
  }

  private hasSubscription(current: Awaited<ReturnType<BillingService["findSubscription"]>>) {
    return Boolean(current?.providerSubscriptionId);
  }

  private subscriptionPlan(current: Awaited<ReturnType<BillingService["findSubscription"]>>) {
    return current?.plan ?? "starter";
  }

  private subscriptionLimit(
    configured: string | null | undefined,
    planValue: string | null | undefined,
    kind: "seatLimit" | "agentLimit",
  ) {
    if (configured) return Number(configured);
    const plan = this.normalizePlan(planValue);
    return kind === "seatLimit" ? this.defaultSeatLimit(plan) : this.defaultAgentLimit(plan);
  }

  private periodEnd(value: Date | null | undefined) {
    return value?.toISOString() ?? null;
  }

  private memberCount(members: Array<{ total: number }>) {
    return Number(members[0]?.total ?? 0);
  }

  async checkout(organizationId: string, dto: CheckoutDto) {
    const baseUrl = this.env.BACHS_API_URL;
    const apiKey = this.env.BACHS_API_KEY;
    if (!baseUrl || !apiKey) throw new BadRequestException("Billing provider is not configured");

    const response = await fetch(
      `${baseUrl.replace(/\/$/, "")}/checkout/sessions`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          organizationId,
          plan: dto.plan,
          successUrl: dto.successUrl,
          cancelUrl: dto.cancelUrl,
        }),
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!response.ok) throw new BadRequestException("Unable to create checkout session");
    return response.json();
  }

  async handleWebhook(rawBody: Buffer, signature?: string) {
    this.verifySignature(rawBody, signature);
    const event = this.parseEvent(rawBody);
    const data = this.requireEventData(event);
    const plan = this.normalizePlan(data.plan);
    const status = this.resolveStatus(event, data);

    await this.upsertSubscription(data, plan, status);
    return { received: true };
  }

  private async upsertSubscription(
    data: NonNullable<BillingEvent["data"]> & { organizationId: string; customerId: string },
    plan: BillingPlan,
    status: string,
  ) {
    const values = this.subscriptionValues(data, plan, status);
    await this.db.insert(subscription).values(values).onConflictDoUpdate({
      target: subscription.organizationId,
      set: this.subscriptionUpdate(values),
    });
  }

  private subscriptionValues(
    data: NonNullable<BillingEvent["data"]> & { organizationId: string; customerId: string },
    plan: BillingPlan,
    status: string,
  ) {
    return {
      organizationId: data.organizationId,
      provider: "bachs" as const,
      providerCustomerId: data.customerId,
      providerSubscriptionId: data.subscriptionId ?? null,
      plan,
      status,
      seatLimit: String(data.seatLimit ?? this.defaultSeatLimit(plan)),
      agentLimit: String(data.agentLimit ?? this.defaultAgentLimit(plan)),
      currentPeriodEnd: this.parsePeriodEnd(data.currentPeriodEnd),
    };
  }

  private subscriptionUpdate(values: ReturnType<BillingService["subscriptionValues"]>) {
    return {
      providerCustomerId: values.providerCustomerId,
      providerSubscriptionId: values.providerSubscriptionId,
      plan: values.plan,
      status: values.status,
      seatLimit: values.seatLimit,
      agentLimit: values.agentLimit,
      currentPeriodEnd: values.currentPeriodEnd,
      updatedAt: new Date(),
    };
  }

  private async requireOrganization(organizationId: string) {
    const org = await this.db.query.organization.findFirst({
      where: eq(organization.id, organizationId),
    });
    if (!org) throw new BadRequestException("Organization not found");
    return org;
  }

  private parseEvent(rawBody: Buffer): BillingEvent {
    try {
      return JSON.parse(rawBody.toString("utf8")) as BillingEvent;
    } catch {
      throw new BadRequestException("Invalid billing webhook");
    }
  }

  private requireEventData(event: BillingEvent): NonNullable<BillingEvent["data"]> & { organizationId: string; customerId: string } {
    const data = event.data;
    if (!data?.organizationId || !data.customerId) {
      throw new BadRequestException("Invalid billing event");
    }
    return data as NonNullable<BillingEvent["data"]> & { organizationId: string; customerId: string };
  }

  private resolveStatus(event: BillingEvent, data: NonNullable<BillingEvent["data"]>): string {
    if (data.status) return data.status;
    const type = event.type ?? "";
    const match = [
      ["cancel", "cancelled"],
      ["expire", "expired"],
      ["activate", "active"],
    ].find(([key]) => type.includes(key));
    if (!match) throw new BadRequestException("Billing event status is required");
    return match[1];
  }

  private parsePeriodEnd(value?: string): Date | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new BadRequestException("Invalid billing period end");
    return date;
  }

  private normalizePlan(value?: string | null): BillingPlan {
    if (value === "growth" || value === "scale") return value;
    return "starter";
  }

  private defaultSeatLimit(plan: BillingPlan): number {
    return planEntitlements[plan].seatLimit;
  }

  private defaultAgentLimit(plan: BillingPlan): number {
    return planEntitlements[plan].agentLimit;
  }

  private verifySignature(rawBody: Buffer, signature?: string) {
    const secret = this.requireWebhookSecret(signature);
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    this.compareSignature(expected, signature ?? "");
  }

  private requireWebhookSecret(signature?: string) {
    const secret = this.env.BACHS_WEBHOOK_SECRET;
    if (!secret || !signature) throw new UnauthorizedException("Webhook signature missing");
    return secret;
  }

  private compareSignature(expected: string, signature: string) {
    const actual = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expected, "utf8");
    const valid = actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
    if (!valid) throw new UnauthorizedException("Webhook signature invalid");
  }
}
