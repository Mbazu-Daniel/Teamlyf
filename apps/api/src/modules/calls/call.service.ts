import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { createHmac } from "node:crypto";
import type { Database } from "@teamlyf/db";
import { subscription } from "@teamlyf/db/billing-schema";
import { eq } from "drizzle-orm";
import { API_ENV } from "../../common/config/env.module";
import type { ApiEnv } from "../../common/config/env";
import { DATABASE } from "../../common/db/db.provider";
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
    const apiKey = this.env.LIVEKIT_API_KEY;
    const apiSecret = this.env.LIVEKIT_API_SECRET;
    const livekitUrl = this.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      throw new BadRequestException("LiveKit is not configured");
    }

    const normalizedRoom = roomName.trim();
    if (!normalizedRoom) {
      throw new BadRequestException("Room name is required");
    }

    const current = await this.db.query.subscription.findFirst({
      where: eq(subscription.organizationId, organizationId),
    });
    const plan = current?.plan === "growth" || current?.plan === "scale" ? current.plan : "starter";
    const tokenTtlSeconds = planEntitlements[plan].callDurationMinutes * 60;

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: apiKey,
      sub: memberId,
      nbf: now,
      exp: now + tokenTtlSeconds,
      name: participantName?.trim() || memberId,
      video: {
        roomJoin: true,
        room: this.roomName(organizationId, normalizedRoom),
        canPublish: true,
        canSubscribe: true,
      },
    };

    return {
      url: livekitUrl,
      room: payload.video.room,
      token: this.sign(payload, apiSecret),
      expiresAt: new Date((now + tokenTtlSeconds) * 1000).toISOString(),
      maxDurationMinutes: planEntitlements[plan].callDurationMinutes,
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
