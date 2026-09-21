import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { AccessToken } from "livekit-server-sdk";
import { API_ENV } from "../../common/config/env.module";
import type { ApiEnv } from "../../common/config/env";
@Injectable()
export class CallService {
  constructor(@Inject(API_ENV) private readonly env: ApiEnv) {}
  async issueToken(organizationId: string, memberId: string, roomName: string, participantName?: string) {
    if (!this.env.LIVEKIT_URL || !this.env.LIVEKIT_API_KEY || !this.env.LIVEKIT_API_SECRET) throw new BadRequestException("LiveKit is not configured");
    const scopedRoom = `${organizationId}:${roomName}`;
    const token = new AccessToken(this.env.LIVEKIT_API_KEY, this.env.LIVEKIT_API_SECRET, { identity: memberId, name: participantName });
    token.addGrant({ roomJoin: true, room: scopedRoom, canPublish: true, canSubscribe: true });
    return { url: this.env.LIVEKIT_URL, room: scopedRoom, token: await token.toJwt() };
  }
}
