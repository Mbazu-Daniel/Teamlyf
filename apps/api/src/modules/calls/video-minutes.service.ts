import { Inject, Injectable } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { callParticipant, videoMinutePeriod, videoMinuteUsageEvent } from "@teamlyf/db";
import { and, eq, sql } from "drizzle-orm";
import { DATABASE } from "../../common/db/db.provider";

/** Monthly allowance granted to an org with no purchased minutes recorded. */
const DEFAULT_VIDEO_MINUTES = 600;

/** The slice of a finalized call session that usage accounting needs. */
export type UsageSession = {
  id: string;
  organizationId: string;
  startedAt: Date | null;
  endedAt: Date | null;
  duration: number | null;
  createdAt: Date;
};

/**
 * Charges ended calls in participant-minutes (sum of each participant's
 * online seconds, rounded up), the billing unit LiveKit's COGS maps onto.
 *
 * `recordCallUsage` is idempotent per session: both the explicit `end-call`
 * socket path and the LiveKit `room_finished` webhook try to charge the same
 * call, and whichever runs second is a no-op.
 *
 * No allowance gate lives here — nothing in this app reads the balance yet,
 * so only the write side of the source's `VideoMinutesService` is ported.
 */
@Injectable()
export class VideoMinutesService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /** Charges one finalized call; returns the participant-minutes billed (0 when nothing counted). */
  async recordCallUsage(session: UsageSession): Promise<number> {
    const existing = await this.db.query.videoMinuteUsageEvent.findFirst({
      where: eq(videoMinuteUsageEvent.callSessionId, session.id),
    });
    if (existing) return existing.participantMinutes;

    const participants = await this.db.query.callParticipant.findMany({
      where: eq(callParticipant.callSessionId, session.id),
    });

    const endedAt = session.endedAt ?? new Date();
    const startedAt = session.startedAt ?? session.createdAt;
    const roomDurationSeconds = Math.max(
      0,
      session.duration ?? Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000),
    );

    let participantSeconds = 0;
    let counted = 0;
    for (const p of participants) {
      const join = p.joinedAt ?? p.wasPresent ?? startedAt;
      const left = p.leftAt ?? endedAt;
      const seconds = Math.max(0, Math.floor((left.getTime() - join.getTime()) / 1000));
      if (seconds <= 0) continue;
      participantSeconds += seconds;
      counted += 1;
    }

    // Rows without join stamps still owe something: bill the whole room.
    if (counted === 0 && roomDurationSeconds > 0) {
      const fallbackCount = Math.max(1, participants.length);
      participantSeconds = roomDurationSeconds * fallbackCount;
      counted = fallbackCount;
    }

    const participantMinutes = Math.ceil(participantSeconds / 60);
    if (participantMinutes <= 0) return 0;

    const period = await this.ensurePeriod(session.organizationId);
    await this.db.insert(videoMinuteUsageEvent).values({
      organizationId: session.organizationId,
      periodId: period.id,
      callSessionId: session.id,
      participantMinutes,
      participantCount: counted,
      durationSeconds: roomDurationSeconds,
    });
    await this.db
      .update(videoMinutePeriod)
      .set({ used: sql`${videoMinutePeriod.used} + ${participantMinutes}`, updatedAt: new Date() })
      .where(eq(videoMinutePeriod.id, period.id));
    return participantMinutes;
  }

  /** Current calendar-month period for the org, created with the default allowance on first use. */
  private async ensurePeriod(organizationId: string) {
    const { start, end } = this.currentCalendarMonth();
    const existing = await this.db.query.videoMinutePeriod.findFirst({
      where: and(eq(videoMinutePeriod.organizationId, organizationId), eq(videoMinutePeriod.periodStart, start)),
    });
    if (existing) return existing;

    const rows = await this.db
      .insert(videoMinutePeriod)
      .values({
        organizationId,
        periodStart: start,
        periodEnd: end,
        includedAllowance: DEFAULT_VIDEO_MINUTES,
      })
      .returning();
    return rows[0];
  }

  private currentCalendarMonth(): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    return { start, end };
  }
}
