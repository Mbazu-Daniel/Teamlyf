import { BadRequestException, Controller, Headers, Inject, Logger, Post, Req, UnauthorizedException } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Database } from "@teamlyf/db";
import { callSession } from "@teamlyf/db";
import type { Request } from "express";
import { eq } from "drizzle-orm";
import { WebhookReceiver } from "livekit-server-sdk";
import type { ApiEnv } from "../../common/config/env";
import { API_ENV } from "../../common/config/env.module";
import { DATABASE } from "../../common/db/db.provider";
import { VideoMinutesService } from "./video-minutes.service";

type RawRequest = Request & { rawBody?: Buffer };

/**
 * LiveKit's server-to-server webhooks, signed with the API key/secret. Runs
 * without session guards (the signature is the auth), mirroring the billing
 * webhook. Its job: finalize sessions nobody ended from the UI — everyone
 * dropped, browser crashed — so history never shows a call stuck "active",
 * and charge the participant-minutes once.
 */
@ApiTags("Calls")
@Controller("webhooks/livekit")
export class CallsWebhookController {
  private readonly logger = new Logger(CallsWebhookController.name);
  private readonly receiver: WebhookReceiver | null;

  constructor(
    @Inject(API_ENV) env: ApiEnv,
    @Inject(DATABASE) private readonly db: Database,
    private readonly videoMinutes: VideoMinutesService,
  ) {
    this.receiver =
      env.LIVEKIT_API_KEY && env.LIVEKIT_API_SECRET
        ? new WebhookReceiver(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET)
        : null;
  }

  @Post()
  @ApiOperation({ summary: "LiveKit webhook: finalize abandoned calls and record usage" })
  async handle(@Req() req: RawRequest, @Headers("authorization") authHeader?: string) {
    if (!this.receiver) throw new BadRequestException("LiveKit webhooks are not configured");

    const rawBody = req.rawBody ?? (req.body ? Buffer.from(JSON.stringify(req.body)) : undefined);
    if (!rawBody) throw new BadRequestException("Missing raw body");

    let event: Awaited<ReturnType<WebhookReceiver["receive"]>>;
    try {
      event = await this.receiver.receive(rawBody.toString("utf-8"), authHeader ?? "");
    } catch {
      throw new UnauthorizedException("Invalid LiveKit webhook signature");
    }

    this.logger.log(`Received LiveKit webhook event: ${event.event}`);
    const room = "room" in event ? event.room : undefined;
    if (event.event === "room_finished" && room?.name) await this.finalizeRoom(room.name);

    return { success: true };
  }

  /** Closes the session the room belonged to and bills it exactly once. */
  private async finalizeRoom(roomName: string): Promise<void> {
    const row = await this.db.query.callSession.findFirst({ where: eq(callSession.roomName, roomName) });
    if (!row || row.status === "ended") return;

    const now = new Date();
    const duration = row.startedAt ? Math.floor((now.getTime() - row.startedAt.getTime()) / 1000) : row.duration;
    await this.db
      .update(callSession)
      .set({ status: "ended", endedAt: now, duration, updatedAt: now })
      .where(eq(callSession.id, row.id));

    const minutes = await this.videoMinutes.recordCallUsage({
      id: row.id,
      organizationId: row.organizationId,
      startedAt: row.startedAt,
      endedAt: now,
      duration,
      createdAt: row.createdAt,
    });
    this.logger.log(`Session ${row.id} ended by room_finished; charged ${minutes} participant-minutes`);
  }
}
