import { BadRequestException } from "@nestjs/common";
import { createHmac } from "node:crypto";
import type { ApiEnv } from "../../common/config/env";

const TOKEN_TTL_SECONDS = 60 * 60;

function requireLivekitConfig(env: ApiEnv): { livekitUrl: string; apiKey: string; apiSecret: string } {
  const { LIVEKIT_URL: livekitUrl, LIVEKIT_API_KEY: apiKey, LIVEKIT_API_SECRET: apiSecret } = env;
  if (!apiKey || !apiSecret || !livekitUrl) throw new BadRequestException("LiveKit is not configured");
  return { livekitUrl, apiKey, apiSecret };
}

function buildTokenPayload(env: ApiEnv, memberId: string, participantName: string, room: string): Record<string, unknown> {
  const { LIVEKIT_API_KEY: apiKey } = env;
  const now = Math.floor(Date.now() / 1000);
  return {
    iss: apiKey,
    sub: memberId,
    nbf: now,
    exp: now + TOKEN_TTL_SECONDS,
    name: participantName,
    video: { roomJoin: true, room, canPublish: true, canSubscribe: true },
  };
}

function signToken(apiSecret: string, payload: Record<string, unknown>): string {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const input = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac("sha256", apiSecret).update(input).digest("base64url");
  return `${input}.${signature}`;
}

/** HS256 LiveKit room token for a member joining a known room name. */
export function signCallToken(env: ApiEnv, memberId: string, participantName: string, room: string): string {
  const { apiSecret } = requireLivekitConfig(env);
  return signToken(apiSecret, buildTokenPayload(env, memberId, participantName, room));
}

/** Pre-refactor `POST .../calls/token`: LiveKit JWT for an arbitrary room name. */
export function issueCallToken(
  env: ApiEnv,
  organizationId: string,
  memberId: string,
  roomName: string,
  participantName?: string,
) {
  const { livekitUrl, apiSecret } = requireLivekitConfig(env);
  const normalizedRoom = roomName.trim();
  if (!normalizedRoom) throw new BadRequestException("Room name is required");
  const now = Math.floor(Date.now() / 1000);
  const room = `organization:${organizationId}:call:${normalizedRoom}`;
  const payload = buildTokenPayload(env, memberId, participantName?.trim() || memberId, room);
  const token = signToken(apiSecret, payload);
  return { url: livekitUrl, room, token, expiresAt: new Date((now + TOKEN_TTL_SECONDS) * 1000).toISOString() };
}
