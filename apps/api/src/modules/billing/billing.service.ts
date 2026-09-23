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
      this.db.query.subscription.findFirst({
        where: eq(subscription.organizationId, organizationId),
      }),
      this.db.select({ total: count() }).from(member).where(eq(member.organizationId, organizationId)),
    ]);
    return {
      plan: current?.plan ?? "starter",
      status: current?.status ?? "inactive",
      seatLimit: Number(current?.seatLimit ?? this.defaultSeatLimit("starter")),
      agentLimit: Number(current?.agentLimit ?? this.defaultAgentLimit("starter")),
      currentPeriodEnd: current?.currentPeriodEnd?.toISOString() ?? null,
      members: Number(members[0]?.total ?? 0),
      provider: current?.provider ?? "bachs",
      hasSubscription: Boolean(current?.providerSubscriptionId),
    };
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

    await this.db
      .insert(subscription)
      .values({
        organizationId: data.organizationId,
        provider: "bachs",
        providerCustomerId: data.customerId,
        providerSubscriptionId: data.subscriptionId ?? null,
        plan,
        status,
        seatLimit: String(data.seatLimit ?? this.defaultSeatLimit(plan)),
        agentLimit: String(data.agentLimit ?? this.defaultAgentLimit(plan)),
        currentPeriodEnd: this.parsePeriodEnd(data.currentPeriodEnd),
      })
      .onConflictDoUpdate({
        target: subscription.organizationId,
        set: {
          providerCustomerId: data.customerId,
          providerSubscriptionId: data.subscriptionId ?? null,
          plan,
          status,
          seatLimit: String(data.seatLimit ?? this.defaultSeatLimit(plan)),
          agentLimit: String(data.agentLimit ?? this.defaultAgentLimit(plan)),
          currentPeriodEnd: this.parsePeriodEnd(data.currentPeriodEnd),
          updatedAt: new Date(),
        },
      });

    return { received: true };
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
    if (event.type?.includes("cancel")) return "cancelled";
    if (event.type?.includes("expire")) return "expired";
    if (event.type?.includes("activate")) return "active";
    throw new BadRequestException("Billing event status is required");
  }

  private parsePeriodEnd(value?: string): Date | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new BadRequestException("Invalid billing period end");
    return date;
  }

  private normalizePlan(value?: string): BillingPlan {
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
    if (!this.env.BACHS_WEBHOOK_SECRET || !signature) {
      throw new UnauthorizedException("Webhook signature missing");
    }
    const expected = createHmac("sha256", this.env.BACHS_WEBHOOK_SECRET).update(rawBody).digest("hex");
    const actual = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expected, "utf8");
    if (actual.length !== expectedBuffer.length || !timingSafeEqual(actual, expectedBuffer)) {
      throw new UnauthorizedException("Webhook signature invalid");
    }
  }
}
