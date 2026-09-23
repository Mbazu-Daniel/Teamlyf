import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { createHmac } from "node:crypto";
import type { Database } from "@teamlyf/db";
import { subscription } from "@teamlyf/db/billing-schema";
import { eq } from "drizzle-orm";
import { API_ENV } from "../../common/config/env.module";
import type { ApiEnv } from "../../common/config/env";
import { DATABASE } from "../../common/db/db.provider";
import type { BillingPlan } from "../billing/billing.dto";
import { planEntitlements } from "../billing/plan-entitlements";

@Injectable()
export class CallService {
  constructor(
    @Inject(API_ENV) private readonly env: ApiEnv,
    @Inject(DATABASE) private readonly db: Database,
  ) {}

  async issueToken(
    organizationId: string,
    memberId: string,
    roomName: string,
    participantName?: string,
  ) {
    const { apiKey, apiSecret, livekitUrl } = this.requireLiveKitConfig();
    const normalizedRoom = this.normalizeRoom(roomName);
    const plan = await this.getPlan(organizationId);
    const durationMinutes = planEntitlements[plan].callDurationMinutes;
    const now = Math.floor(Date.now() / 1000);
    const room = this.roomName(organizationId, normalizedRoom);
    const payload = this.createTokenPayload(apiKey, memberId, participantName, room, now, durationMinutes);

    return {
      url: livekitUrl,
      room,
      token: this.sign(payload, apiSecret),
      expiresAt: new Date((now + durationMinutes * 60) * 1000).toISOString(),
      maxDurationMinutes: durationMinutes,
    };
  }

  private requireLiveKitConfig() {
    const { LIVEKIT_API_KEY: apiKey, LIVEKIT_API_SECRET: apiSecret, LIVEKIT_URL: livekitUrl } = this.env;
    if (!apiKey || !apiSecret || !livekitUrl) {
      throw new BadRequestException("LiveKit is not configured");
    }
    return { apiKey, apiSecret, livekitUrl };
  }

  private normalizeRoom(roomName: string) {
    const normalized = roomName.trim();
    if (!normalized) throw new BadRequestException("Room name is required");
    return normalized;
  }

  private async getPlan(organizationId: string): Promise<BillingPlan> {
    const current = await this.db.query.subscription.findFirst({
      where: eq(subscription.organizationId, organizationId),
    });
    return this.normalizePlan(current?.plan);
  }

  private normalizePlan(value?: string | null): BillingPlan {
    if (value === "growth" || value === "scale") return value;
    return "starter";
  }

  private createTokenPayload(
    apiKey: string,
    memberId: string,
    participantName: string | undefined,
    room: string,
    now: number,
    durationMinutes: number,
  ) {
    return {
      iss: apiKey,
      sub: memberId,
      nbf: now,
      exp: now + durationMinutes * 60,
      name: participantName?.trim() || memberId,
      video: {
        roomJoin: true,
        room,
        canPublish: true,
        canSubscribe: true,
      },
    };
  }

  private roomName(organizationId: string, roomName: string): string {
    return `organization:${organizationId}:call:${roomName}`;
  }

  private sign(payload: Record<string, unknown>, secret: string): string {
    const header = { alg: "HS256", typ: "JWT" };
    const encodedHeader = this.encode(header);
    const encodedPayload = this.encode(payload);
    const input = `${encodedHeader}.${encodedPayload}`;
    const signature = createHmac("sha256", secret).update(input).digest("base64url");
    return `${input}.${signature}`;
  }

  private encode(value: Record<string, unknown>): string {
    return Buffer.from(JSON.stringify(value)).toString("base64url");
  }
}
