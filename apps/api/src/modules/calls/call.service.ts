import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { createHmac } from "node:crypto";
import { API_ENV } from "../../common/config/env.module";
import type { ApiEnv } from "../../common/config/env";

const TOKEN_TTL_SECONDS = 60 * 60;

@Injectable()
export class CallService {
  constructor(@Inject(API_ENV) private readonly env: ApiEnv) {}

  issueToken(
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

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: apiKey,
      sub: memberId,
      nbf: now,
      exp: now + TOKEN_TTL_SECONDS,
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
      expiresAt: new Date((now + TOKEN_TTL_SECONDS) * 1000).toISOString(),
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
