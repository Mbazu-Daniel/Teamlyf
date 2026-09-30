import { BadRequestException, Inject, Injectable, PayloadTooLargeException } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { messageAttachment } from "@teamlyf/db";
import type { ApiEnv } from "../../../common/config/env";
import { API_ENV } from "../../../common/config/env.module";
import { DATABASE } from "../../../common/db/db.provider";
import { PresignedUploadService } from "../../../common/storage/presigned-upload.service";
import { STORAGE_SERVICE, type StorageService } from "../../../common/storage/storage.types";
import type { InitiateUploadDto } from "./dto/initiate-upload.dto";

export type InitiateUploadResult = {
  attachmentId: string;
  uploadUrl: string;
  fileKey: string;
  headers: Record<string, string>;
  expiresAt: Date;
};

@Injectable()
export class MessageAttachmentsService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
    private readonly presigned: PresignedUploadService,
    @Inject(API_ENV) private readonly env: ApiEnv,
  ) {}

  async initiateUpload(
    organizationId: string,
    memberId: string,
    dto: InitiateUploadDto,
  ): Promise<InitiateUploadResult> {
    if (dto.fileName.trim().length === 0) {
      throw new BadRequestException("fileName must not be empty");
    }
    if (dto.fileSize > this.env.STORAGE_MAX_UPLOAD_BYTES) {
      throw new PayloadTooLargeException(
        `File exceeds the ${this.env.STORAGE_MAX_UPLOAD_BYTES} byte upload limit`,
      );
    }

    const target = await this.presigned.issueUploadUrl({
      organizationId,
      location: "chat",
      fileName: dto.fileName,
      contentType: dto.mimeType,
    });

    const [row] = await this.db
      .insert(messageAttachment)
      .values({
        organizationId,
        memberId,
        fileKey: target.fileKey,
        originalFileName: dto.fileName,
        mimeType: dto.mimeType,
        fileSize: dto.fileSize,
        channelMessageId: null,
        directMessageId: null,
      })
      .returning({ id: messageAttachment.id });

    return {
      attachmentId: row.id,
      uploadUrl: target.uploadUrl,
      fileKey: target.fileKey,
      headers: target.headers,
      expiresAt: target.expiresAt,
    };
  }
}
