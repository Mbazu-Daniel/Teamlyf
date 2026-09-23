import { BadRequestException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Database } from "@teamlyf/db";
import { member, organization } from "@teamlyf/db/organization-schema";
import { billingSchema } from "@teamlyf/db";

const { subscription } = billingSchema;
import { count, eq } from "drizzle-orm";
import { API_ENV } from "../../common/config/env.module";
import type { ApiEnv } from "../../common/config/env";
import { DATABASE } from "../../common/db/db.provider";
import type { BillingPlan, CheckoutDto } from "./billing.dto";
import { planEntitlements } from "./plan-entitlements";

type BillingEvent = {
  type?: string;
  data?: {
    organizationId?: string;
    customerId?: string;
    subscriptionId?: string;
    plan?: string;
    status?: string;
    seatLimit?: number;
    currentPeriodEnd?: string;
  };
};

type BillingEventData = NonNullable<BillingEvent["data"]>;

@Injectable()
export class BillingService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(API_ENV) private readonly env: ApiEnv,
  ) {}

  async summary(organizationId: string) {
    await this.requireOrganization(organizationId);
    const [current, members] = await this.loadSummaryData(organizationId);
    return this.buildSummary(current, Number(members[0]?.total ?? 0));
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
      },
    );

    if (!response.ok) throw new BadRequestException("Unable to create checkout session");
    return response.json();
  }

  async handleWebhook(rawBody: Buffer, signature?: string) {
    this.verifySignature(rawBody, signature);
    const event = this.parseWebhook(rawBody);
    const data = this.requireEventData(event.data);
    await this.saveSubscription(data, event.type);
    return { received: true };
  }

  private async requireOrganization(organizationId: string) {
    const org = await this.db.query.organization.findFirst({
      where: eq(organization.id, organizationId),
    });
    if (!org) throw new BadRequestException("Organization not found");
    return org;
  }

  private async loadSummaryData(organizationId: string) {
    return Promise.all([
      this.db.query.subscription.findFirst({
        where: eq(subscription.organizationId, organizationId),
      }),
      this.db.select({ total: count() }).from(member).where(eq(member.organizationId, organizationId)),
    ]);
  }

  private buildSummary(
    current: {
      plan: string;
      status: string;
      seatLimit: string;
      currentPeriodEnd: Date | null;
      provider: string;
      providerSubscriptionId: string | null;
    } | undefined,
    memberCount: number,
  ) {
    const plan = this.normalizePlan(current?.plan);
    return {
      plan,
      status: current?.status ?? "inactive",
      seatLimit: Number(current?.seatLimit ?? 5),
      agentLimit: planEntitlements[plan].agentLimit,
      currentPeriodEnd: current?.currentPeriodEnd?.toISOString() ?? null,
      members: memberCount,
      provider: current?.provider ?? "bachs",
      hasSubscription: Boolean(current?.providerSubscriptionId),
    };
  }

  private parseWebhook(rawBody: Buffer): BillingEvent {
    try {
      return JSON.parse(rawBody.toString("utf8")) as BillingEvent;
    } catch {
      throw new BadRequestException("Invalid billing webhook");
    }
  }

  private requireEventData(data?: BillingEventData): BillingEventData {
    if (!data?.organizationId || !data.customerId) {
      throw new BadRequestException("Invalid billing event");
    }
    return data;
  }

  private async saveSubscription(data: BillingEventData, eventType?: string) {
    const plan = this.normalizePlan(data.plan);
    const status = data.status ?? (eventType?.includes("cancel") ? "cancelled" : "active");
    const seatLimit = String(data.seatLimit ?? this.defaultSeatLimit(plan));
    const currentPeriodEnd = data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : null;

    await this.db
      .insert(subscription)
      .values({
        organizationId: data.organizationId!,
        provider: "bachs",
        providerCustomerId: data.customerId!,
        providerSubscriptionId: data.subscriptionId ?? null,
        plan,
        status,
        seatLimit,
        currentPeriodEnd,
      })
      .onConflictDoUpdate({
        target: subscription.organizationId,
        set: {
          providerCustomerId: data.customerId!,
          providerSubscriptionId: data.subscriptionId ?? null,
          plan,
          status,
          seatLimit,
          currentPeriodEnd,
          updatedAt: new Date(),
        },
      });
  }

  private normalizePlan(value?: string): BillingPlan {
    if (value === "growth" || value === "scale") return value;
    return "starter";
  }

  private defaultSeatLimit(plan: BillingPlan): number {
    return plan === "scale" ? 250 : plan === "growth" ? 50 : 5;
  }

  private verifySignature(rawBody: Buffer, signature?: string) {
    const secret = this.env.BACHS_WEBHOOK_SECRET;
    if (!secret || !signature) throw new UnauthorizedException("Webhook signature missing");

    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    const actual = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expected, "utf8");

    if (actual.length !== expectedBuffer.length) {
      throw new UnauthorizedException("Webhook signature invalid");
    }
    this.assertSignatureMatch(actual, expectedBuffer);
  }

  private assertSignatureMatch(actual: Buffer, expected: Buffer) {
    if (!timingSafeEqual(actual, expected)) {
      throw new UnauthorizedException("Webhook signature invalid");
    }
  }
}
