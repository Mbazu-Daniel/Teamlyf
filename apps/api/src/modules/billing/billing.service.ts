import { BadRequestException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Database } from "@teamlyf/db";
import { organization } from "@teamlyf/db/organization-schema";
import { member } from "@teamlyf/db/organization-schema";
import { subscription } from "@teamlyf/db/workspace-schema";
import { count, eq } from "drizzle-orm";
import { DATABASE } from "../../common/db/db.provider";
import { API_ENV } from "../../common/config/env.module";
import type { ApiEnv } from "../../common/config/env";
import type { CheckoutDto } from "./dto";

type BachsEvent = { type: string; data: { organizationId: string; customerId: string; subscriptionId?: string; plan?: string; status?: string; seatLimit?: number; agentLimit?: number; currentPeriodEnd?: string } };
@Injectable()
export class BillingService {
  constructor(@Inject(DATABASE) private readonly db: Database, @Inject(API_ENV) private readonly env: ApiEnv) {}
  async checkout(organizationId: string, dto: CheckoutDto) {
    if (!this.env.BACHS_API_URL || !this.env.BACHS_API_KEY) throw new BadRequestException("bachs.io is not configured");
    const response = await fetch(`${this.env.BACHS_API_URL.replace(/\/$/, "")}/checkout/sessions`, { method: "POST", headers: { authorization: `Bearer ${this.env.BACHS_API_KEY}`, "content-type": "application/json" }, body: JSON.stringify({ organizationId, plan: dto.plan, successUrl: dto.successUrl, cancelUrl: dto.cancelUrl }) });
    if (!response.ok) throw new BadRequestException("Unable to create checkout session");
    return response.json();
  }
  async summary(organizationId: string) {
    const [workspace, activeSubscription, members] = await Promise.all([
      this.db.query.organization.findFirst({ where: eq(organization.id, organizationId) }),
      this.db.query.subscription.findFirst({ where: eq(subscription.organizationId, organizationId) }),
      this.db.select({ total: count() }).from(member).where(eq(member.organizationId, organizationId)),
    ]);
    if (!workspace) throw new BadRequestException("Organization not found");
    return { plan: activeSubscription?.plan ?? workspace.plan, status: activeSubscription?.status ?? "inactive", seatLimit: Number(activeSubscription?.seatLimit ?? 5), agentLimit: Number(activeSubscription?.agentLimit ?? 0), currentPeriodEnd: activeSubscription?.currentPeriodEnd ?? null, members: members[0]?.total ?? 0, hasPaymentMethod: Boolean(workspace.bachsCustomerId), invoices: [] };
  }
  async handleWebhook(rawBody: Buffer, signature: string | undefined) {
    this.verify(rawBody, signature);
    const event = JSON.parse(rawBody.toString("utf8")) as BachsEvent;
    if (!event.data?.organizationId || !event.data.customerId) throw new BadRequestException("Invalid billing event");
    const data = event.data;
    const plan = data.plan ?? "starter";
    const status = data.status ?? (event.type.includes("cancel") ? "cancelled" : "active");
    await this.db.insert(subscription).values({ organizationId: data.organizationId, bachsCustomerId: data.customerId, bachsSubscriptionId: data.subscriptionId ?? null, plan, status, seatLimit: String(data.seatLimit ?? 5), agentLimit: String(data.agentLimit ?? 0), currentPeriodEnd: data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : null }).onConflictDoUpdate({ target: subscription.organizationId, set: { bachsCustomerId: data.customerId, bachsSubscriptionId: data.subscriptionId ?? null, plan, status, seatLimit: String(data.seatLimit ?? 5), agentLimit: String(data.agentLimit ?? 0), currentPeriodEnd: data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : null, updatedAt: new Date() } });
    await this.db.update(organization).set({ plan, bachsCustomerId: data.customerId, updatedAt: new Date() }).where(eq(organization.id, data.organizationId));
    return { received: true };
  }
  private verify(rawBody: Buffer, signature?: string) {
    if (!this.env.BACHS_WEBHOOK_SECRET || !signature) throw new UnauthorizedException("Webhook signature missing");
    const expected = createHmac("sha256", this.env.BACHS_WEBHOOK_SECRET).update(rawBody).digest("hex");
    const actual = Buffer.from(signature, "utf8"); const expectedBuffer = Buffer.from(expected, "utf8");
    if (actual.length !== expectedBuffer.length || !timingSafeEqual(actual, expectedBuffer)) throw new UnauthorizedException("Webhook signature invalid");
  }
}
