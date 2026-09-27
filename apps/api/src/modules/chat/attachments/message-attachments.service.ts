import { BadRequestException, Inject, Injectable, PayloadTooLargeException } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { generateId, messageAttachment } from "@teamlyf/db";
import type { ApiEnv } from "../../../common/config/env";
import { API_ENV } from "../../../common/config/env.module";
import { DATABASE } from "../../../common/db/db.provider";
import { STORAGE_SERVICE, type StorageService } from "../../../common/storage/storage.types";
import type { InitiateUploadDto } from "./dto/initiate-upload.dto";

export type InitiateUploadResult = {
  attachmentId: string;
  uploadUrl: string;
};

/** Keys are server-built: no separators, no traversal, no surprise characters. */
function safeFileName(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? "";
  const cleaned = base
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^[.-]+/, "")
    .slice(0, 120);
  return cleaned || "file";
}

@Injectable()
export class MessageAttachmentsService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
    @Inject(API_ENV) private readonly env: ApiEnv,
  ) {}

  /**
   * Inserts the attachment row unlinked (both message ids stay NULL until the
   * message is actually sent) and hands back a capability URL the browser PUTs
   * the bytes to. The key is generated here, so the client never picks a path.
   */
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

    const key = `attachments/${organizationId}/${generateId()}/${safeFileName(dto.fileName)}`;

    const [row] = await this.db
      .insert(messageAttachment)
      .values({
        organizationId,
        memberId,
        fileKey: key,
        originalFileName: dto.fileName,
        mimeType: dto.mimeType,
        fileSize: dto.fileSize,
        channelMessageId: null,
        directMessageId: null,
      })
      .returning({ id: messageAttachment.id });

    const { uploadUrl } = await this.storage.createUploadUrl({
      key,
      contentType: dto.mimeType,
    });

    return { attachmentId: row.id, uploadUrl };
  }
}
