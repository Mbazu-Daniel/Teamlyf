import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { taskAttachment } from "@teamlyf/db/project-schema";
import { and, eq } from "drizzle-orm";
import { DATABASE } from "../../../common/db/db.provider";
import { STORAGE_SERVICE, type StorageService } from "../../../common/storage/storage.types";
import { ProjectAccessService } from "../project-access.service";
import type { CreateAttachmentDto, InitiateAttachmentUploadDto } from "./dto";

/**
 * Task attachments: the API owns the record, the storage seam owns the bytes.
 * The database row is only written after the object is confirmed to exist, so
 * a task never advertises a file nobody uploaded.
 */
@Injectable()
export class AttachmentService {
  private readonly logger = new Logger(AttachmentService.name);

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
    private readonly access: ProjectAccessService,
  ) {}

  async getAttachments(orgId: string, projectId: string, taskId: string) {
    await this.access.requireTask(orgId, projectId, taskId);
    return this.db.query.taskAttachment.findMany({
      where: and(
        eq(taskAttachment.taskId, taskId),
        eq(taskAttachment.organizationId, orgId),
      ),
      orderBy: (a, { asc }) => [asc(a.createdAt)],
    });
  }

  async createUploadUrl(
    orgId: string,
    projectId: string,
    taskId: string,
    dto: InitiateAttachmentUploadDto,
  ) {
    await this.access.requireTask(orgId, projectId, taskId);
    return this.storage.createUploadUrl({
      key: `${objectPrefix(orgId, taskId)}${sanitizeFileName(dto.fileName)}-${Date.now()}`,
      contentType: dto.mimeType,
    });
  }

  async createAttachment(
    orgId: string,
    projectId: string,
    taskId: string,
    dto: CreateAttachmentDto,
    memberId: string,
  ) {
    await this.access.requireTask(orgId, projectId, taskId);

    // The key is minted for this task alone, so a confirmed attachment can
    // never point at another organization's or task's object.
    if (!dto.fileKey.startsWith(objectPrefix(orgId, taskId))) {
      throw new BadRequestException("Invalid file key");
    }
    if (!(await this.storage.objectExists(dto.fileKey))) {
      throw new BadRequestException("Uploaded file not found in storage");
    }

    const [created] = await this.db
      .insert(taskAttachment)
      .values({
        taskId,
        organizationId: orgId,
        memberId,
        fileKey: dto.fileKey,
        originalFileName: dto.originalFileName,
        mimeType: dto.mimeType,
        fileSize: dto.fileSize,
      })
      .returning();
    return created;
  }

  async createDownloadUrl(
    orgId: string,
    projectId: string,
    taskId: string,
    attachmentId: string,
  ) {
    const attachment = await this.requireAttachment(orgId, projectId, taskId, attachmentId);
    const { url } = await this.storage.createDownloadUrl(
      attachment.fileKey,
      attachment.originalFileName,
    );
    return { url, fileName: attachment.originalFileName };
  }

  async deleteAttachment(
    orgId: string,
    projectId: string,
    taskId: string,
    attachmentId: string,
    memberId: string,
  ) {
    const attachment = await this.requireAttachment(orgId, projectId, taskId, attachmentId);
    if (attachment.memberId !== memberId) {
      throw new ForbiddenException("You can only delete attachments you uploaded");
    }

    try {
      await this.storage.deleteObject(attachment.fileKey);
    } catch (error) {
      // An orphaned object is recoverable; a row the user cannot delete is not.
      this.logger.warn(
        `Failed to delete stored object ${attachment.fileKey}: ${toMessage(error)}`,
      );
    }

    await this.db.delete(taskAttachment).where(eq(taskAttachment.id, attachmentId));
  }

  private async requireAttachment(
    orgId: string,
    projectId: string,
    taskId: string,
    attachmentId: string,
  ) {
    await this.access.requireTask(orgId, projectId, taskId);
    const found = await this.db.query.taskAttachment.findFirst({
      where: and(
        eq(taskAttachment.id, attachmentId),
        eq(taskAttachment.taskId, taskId),
        eq(taskAttachment.organizationId, orgId),
      ),
    });
    if (!found) throw new NotFoundException("Attachment not found");
    return found;
  }
}

/** Every object for a task lives under one organization-scoped prefix. */
function objectPrefix(orgId: string, taskId: string) {
  return `${orgId}/tasks/${taskId}/`;
}

/** Mirrors the reference layout: lowercase, spaces to dashes, extension kept. */
function sanitizeFileName(fileName: string) {
  const lastDot = fileName.lastIndexOf(".");
  const base = lastDot > 0 ? fileName.slice(0, lastDot) : fileName;
  const extension = lastDot > 0 ? fileName.slice(lastDot) : "";
  return base.toLowerCase().replace(/\s+/g, "-") + extension;
}

function toMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
