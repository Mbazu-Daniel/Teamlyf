import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { callParticipant, callSession, channel, channelMember, generateId, member } from "@teamlyf/db";
import { and, eq, inArray } from "drizzle-orm";
import type { ApiEnv } from "../../common/config/env";
import { API_ENV } from "../../common/config/env.module";
import { DATABASE } from "../../common/db/db.provider";
import { toCallSessionDto } from "./call.mapper";
import { getCallHistory, loadMemberSummaries, loadMissedCalls, loadParticipants } from "./calls-history.mapper";
import { issueCallToken, signCallToken } from "./calls-token";
import type {
  CallHistoryRecord,
  CallMemberSummary,
  CallSessionDto,
  CallSessionRow,
  InitiateCallArgs,
  JoinCallResult,
} from "./calls.types";
import { VideoMinutesService } from "./video-minutes.service";

// Types stay importable from this path for existing consumers; canonical home is ./calls.types.
export type * from "./calls.types";

@Injectable()
export class CallsService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(API_ENV) private readonly env: ApiEnv,
    private readonly videoMinutes: VideoMinutesService,
  ) {}

  // ------------------------------------------------------------- lifecycle

  /**
   * Creates the ringing call: one `call_session` row plus pending participants,
   * returns the DTO the `initiate-call` ack carries. Channel calls require the
   * caller to be a channel member; DM calls require both members in the org.
   */
  async initiate(args: InitiateCallArgs): Promise<CallSessionDto> {
    const { organizationId, initiatorId } = args;
    const callType = args.callType === "video" ? "video" : "voice";

    let recipientId: string | null = null;
    let channelId: string | null = null;
    let invited: string[] = [];

    if (args.channelId) {
      channelId = args.channelId;
      const channelRow = await this.db.query.channel.findFirst({
        where: and(eq(channel.id, channelId), eq(channel.organizationId, organizationId)),
      });
      if (!channelRow) throw new NotFoundException("Channel not found");
      const membership = await this.db.query.channelMember.findFirst({
        where: and(eq(channelMember.channelId, channelId), eq(channelMember.memberId, initiatorId)),
      });
      if (!membership) throw new ForbiddenException("You must be a member of this channel");
      invited = [...new Set(args.participantIds ?? [])].filter((id) => typeof id === "string" && id && id !== initiatorId);
    } else if (args.recipientId) {
      recipientId = args.recipientId;
      if (recipientId === initiatorId) throw new BadRequestException("Cannot call yourself");
      invited = [recipientId];
    } else {
      throw new BadRequestException("recipientId or channelId is required");
    }

    const memberIds = [initiatorId, ...invited];
    const members = await this.db.query.member.findMany({
      where: and(eq(member.organizationId, organizationId), inArray(member.id, memberIds)),
    });
    if (!members.some((row) => row.id === initiatorId)) {
      throw new ForbiddenException("Not a member of this organization");
    }
    if (invited.some((id) => !members.some((row) => row.id === id))) {
      throw new NotFoundException("Recipient not found in this organization");
    }

    const id = generateId();
    const roomName = `organization:${organizationId}:call:${id}`;
    const startedAt = new Date();

    const [row] = await this.db
      .insert(callSession)
      .values({
        id,
        organizationId,
        roomName,
        callType,
        status: "active",
        initiatorId,
        channelId,
        recipientId,
        startedAt,
      })
      .returning();

    await this.db
      .insert(callParticipant)
      .values(
        [initiatorId, ...invited].map((memberId) => ({ callSessionId: id, memberId, status: "pending" as const })),
      );

    const participants = await loadParticipants(this.db, [id]);
    return toCallSessionDto(row, participants.get(id) ?? []);
  }

  /**
   * Marks the caller/accepter joined and issues the LiveKit room token.
   * Backs both the `accept-call` ack and `POST /calls/:callId/join`.
   */
  async join(callId: string, organizationId: string, memberId: string): Promise<JoinCallResult> {
    const row = await this.requireActiveSession(callId, organizationId);
    await this.requireCanJoin(row, organizationId, memberId);

    const now = new Date();
    const existing = await this.db.query.callParticipant.findFirst({
      where: and(eq(callParticipant.callSessionId, callId), eq(callParticipant.memberId, memberId)),
    });
    if (existing) {
      if (existing.status !== "joined") {
        await this.db
          .update(callParticipant)
          .set({ status: "joined", joinedAt: existing.joinedAt ?? now, updatedAt: now })
          .where(eq(callParticipant.id, existing.id));
      }
    } else {
      await this.db.insert(callParticipant).values({ callSessionId: callId, memberId, status: "joined", joinedAt: now });
    }

    const summary = (await loadMemberSummaries(this.db, organizationId, [memberId])).get(memberId);
    const participantName = summary ? displayName(summary) : memberId;
    const token = signCallToken(this.env, memberId, participantName, row.roomName);

    const participants = await loadParticipants(this.db, [callId]);
    return {
      success: true,
      token,
      roomName: row.roomName,
      callSession: toCallSessionDto(row, participants.get(callId) ?? []),
      participantPhoto: summary?.photoUrl ?? null,
      participantName,
    };
  }
  /**
   * Records a rejection. A rejected 1:1 call also ends the session (the UI
   * treats it as terminal); channel calls keep ringing for everyone else.
   * Tolerates an already-ended session so socket retries stay harmless.
   */
  async reject(callId: string, organizationId: string, memberId: string): Promise<CallSessionDto> {
    const row = await this.requireSession(callId, organizationId);
    await this.requireCanJoin(row, organizationId, memberId);

    if (row.status === "active") {
      const now = new Date();
      const existing = await this.db.query.callParticipant.findFirst({
        where: and(eq(callParticipant.callSessionId, callId), eq(callParticipant.memberId, memberId)),
      });
      if (existing) {
        if (existing.status === "pending") {
          await this.db
            .update(callParticipant)
            .set({ status: "rejected", updatedAt: now })
            .where(eq(callParticipant.id, existing.id));
        }
      } else {
        await this.db
          .insert(callParticipant)
          .values({ callSessionId: callId, memberId, status: "rejected" });
      }

      if (!row.channelId && row.recipientId === memberId) {
        const duration = elapsedSeconds(row.startedAt, now);
        await this.db
          .update(callSession)
          .set({ status: "ended", endedAt: now, duration, updatedAt: now })
          .where(eq(callSession.id, callId));
      }
    }

    const refreshed = await this.requireSession(callId, organizationId);
    const participants = await loadParticipants(this.db, [callId]);
    return toCallSessionDto(refreshed, participants.get(callId) ?? []);
  }

  /** Ends the call, stamps duration and the actor's `left` participant row. Idempotent. */
  async end(callId: string, organizationId: string, memberId: string): Promise<CallSessionDto> {
    const row = await this.requireSession(callId, organizationId);
    await this.requireCanJoin(row, organizationId, memberId);

    if (row.status === "active") {
      const now = new Date();
      const duration = elapsedSeconds(row.startedAt, now);
      await this.db
        .update(callSession)
        .set({ status: "ended", endedAt: now, duration, updatedAt: now })
        .where(eq(callSession.id, callId));

      const existing = await this.db.query.callParticipant.findFirst({
        where: and(eq(callParticipant.callSessionId, callId), eq(callParticipant.memberId, memberId)),
      });
      if (existing && existing.status === "joined") {
        await this.db
          .update(callParticipant)
          .set({ status: "left", leftAt: now, updatedAt: now })
          .where(eq(callParticipant.id, existing.id));
      }

      await this.videoMinutes.recordCallUsage({
        id: row.id,
        organizationId: row.organizationId,
        startedAt: row.startedAt,
        endedAt: now,
        duration,
        createdAt: row.createdAt,
      });
    }

    const refreshed = await this.requireSession(callId, organizationId);
    const participants = await loadParticipants(this.db, [callId]);
    return toCallSessionDto(refreshed, participants.get(callId) ?? []);
  }
  // -------------------------------------------------------- history + tokens

  /** Sessions I started, received, or was invited to, newest first. */
  async getHistory(organizationId: string, memberId: string): Promise<CallHistoryRecord[]> {
    return getCallHistory(this.db, organizationId, memberId);
  }

  /**
   * Ended sessions I never joined that were addressed to me: a 1:1 call where
   * I was the recipient, or a channel call with my invite pending/rejected.
   */
  async getMissedCalls(organizationId: string, memberId: string): Promise<CallHistoryRecord[]> {
    return loadMissedCalls(this.db, organizationId, memberId);
  }

  /** Pre-refactor `POST .../calls/token`: LiveKit JWT for an arbitrary room name. */
  issueToken(organizationId: string, memberId: string, roomName: string, participantName?: string) {
    return issueCallToken(this.env, organizationId, memberId, roomName, participantName);
  }
  // ---------------------------------------------------------------- private

  private async requireSession(callId: string, organizationId: string): Promise<CallSessionRow> {
    const row = await this.db.query.callSession.findFirst({
      where: and(eq(callSession.id, callId), eq(callSession.organizationId, organizationId)),
    });
    if (!row) throw new NotFoundException("Call not found");
    return row;
  }

  private async requireActiveSession(callId: string, organizationId: string): Promise<CallSessionRow> {
    const row = await this.requireSession(callId, organizationId);
    if (row.status !== "active") throw new BadRequestException("Call has ended");
    return row;
  }

  /** Initiator, recipient, invited participant, or a member of the call's channel. */
  private async requireCanJoin(row: CallSessionRow, organizationId: string, memberId: string): Promise<void> {
    if (row.initiatorId === memberId || row.recipientId === memberId) return;
    const participant = await this.db.query.callParticipant.findFirst({
      where: and(eq(callParticipant.callSessionId, row.id), eq(callParticipant.memberId, memberId)),
    });
    if (participant) return;
    if (row.channelId) {
      const membership = await this.db.query.channelMember.findFirst({
        where: and(eq(channelMember.channelId, row.channelId), eq(channelMember.memberId, memberId)),
      });
      if (membership) return;
    }
    throw new ForbiddenException("You are not part of this call");
  }
}

function displayName(summary: CallMemberSummary): string {
  const fromUser = summary.user.name.trim();
  if (fromUser) return fromUser;
  const fromMember = `${summary.firstName ?? ""} ${summary.lastName ?? ""}`.trim();
  return fromMember || summary.id;
}

function elapsedSeconds(startedAt: Date | null, now: Date): number {
  if (!startedAt) return 0;
  return Math.max(0, Math.floor((now.getTime() - startedAt.getTime()) / 1000));
}
