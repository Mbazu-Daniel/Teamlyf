import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { callParticipant, callSession } from "@teamlyf/db";
import { and, eq } from "drizzle-orm";
import { DATABASE } from "../../common/db/db.provider";
import { PresignedUploadService } from "../../common/storage/presigned-upload.service";

@Injectable()
export class CallRecordingService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly presigned: PresignedUploadService,
  ) {}

  async initiateUpload(
    organizationId: string,
    callId: string,
    memberId: string,
    dto: { fileName: string; mimeType: string },
  ) {
    await this.requireParticipant(organizationId, callId, memberId);

    const target = await this.presigned.issueRecordingUrl({
      organizationId,
      callId,
      fileName: dto.fileName,
      contentType: dto.mimeType,
    });

    await this.db
      .update(callSession)
      .set({ isRecording: true, updatedAt: new Date() })
      .where(and(eq(callSession.id, callId), eq(callSession.organizationId, organizationId)));

    return { uploadUrl: target.uploadUrl, fileKey: target.fileKey, headers: target.headers };
  }

  async confirmUpload(organizationId: string, callId: string, memberId: string, fileKey: string) {
    await this.requireParticipant(organizationId, callId, memberId);
    await this.presigned.confirmUpload({
      organizationId,
      location: "recordings",
      scope: [callId],
      fileKey,
    });

    const [updated] = await this.db
      .update(callSession)
      .set({
        isRecording: false,
        recordingId: fileKey,
        recordingUrl: fileKey,
        updatedAt: new Date(),
      })
      .where(and(eq(callSession.id, callId), eq(callSession.organizationId, organizationId)))
      .returning();

    return updated ?? { id: callId, fileKey };
  }

  async getPlaybackUrl(organizationId: string, callId: string, memberId: string) {
    await this.requireParticipant(organizationId, callId, memberId);
    const session = await this.db.query.callSession.findFirst({
      where: and(eq(callSession.id, callId), eq(callSession.organizationId, organizationId)),
    });
    if (!session) throw new NotFoundException("Call not found");
    if (!session.recordingId) throw new NotFoundException("This call has no recording");

    const { url, expiresAt } = await this.presigned.issueDownloadUrl(
      session.recordingId,
      "recording.webm",
    );
    return { url, expiresAt };
  }

  private async requireParticipant(
    organizationId: string,
    callId: string,
    memberId: string,
  ): Promise<void> {
    const session = await this.db.query.callSession.findFirst({
      where: and(eq(callSession.id, callId), eq(callSession.organizationId, organizationId)),
    });
    if (!session) throw new NotFoundException("Call not found");
    if (session.initiatorId === memberId) return;

    const participant = await this.db.query.callParticipant.findFirst({
      where: and(eq(callParticipant.callSessionId, callId), eq(callParticipant.memberId, memberId)),
    });
    if (!participant) throw new ForbiddenException("You were not part of this call");
  }
}
