import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { Inject } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { documentsSchema, generateId } from "@teamlyf/db";
import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { DATABASE } from "../../common/db/db.provider";
import type {
  CreateDocumentDto,
  SetDocumentPermissionDto,
  UpdateDocumentDto,
  UploadDocumentDto,
} from "./document.dto";
import { STORAGE_SERVICE, type StorageService } from "../../common/storage/storage.types";
import { requireOrganizationMember } from "../../common/organization-member";

const { document, documentPermission, documentVersion } = documentsSchema;

@Injectable()
export class DocumentService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  async getDocuments(organizationId: string, memberId: string, page = 1, limit = 50) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const permissions = await this.db.query.documentPermission.findMany({
      where: and(
        eq(documentPermission.subjectKind, "member"),
        eq(documentPermission.subjectId, memberId),
      ),
      columns: { documentId: true },
    });
    const sharedIds = permissions.map((item) => item.documentId);
    const accessCondition = sharedIds.length
      ? or(
          isNull(document.ownerId),
          eq(document.ownerId, memberId),
          inArray(document.id, sharedIds),
        )
      : or(isNull(document.ownerId), eq(document.ownerId, memberId));

    return this.db.query.document.findMany({
      where: and(
        eq(document.organizationId, organizationId),
        eq(document.uploadReady, true),
        accessCondition,
      ),
      columns: {
        id: true,
        organizationId: true,
        ownerId: true,
        parentId: true,
        title: true,
        mimeType: true,
        objectKey: true,
        createdAt: true,
        updatedAt: true,
        fileSize: true,
        deletedAt: true,
      },
      orderBy: (table, { desc }) => [desc(table.updatedAt)],
      limit: safeLimit,
      offset: (safePage - 1) * safeLimit,
    });
  }

  async get(organizationId: string, documentId: string, memberId: string) {
    return this.requireReadable(organizationId, documentId, memberId);
  }

  async create(organizationId: string, memberId: string, dto: CreateDocumentDto) {
    await this.requireMember(organizationId, memberId);
    await this.requireParentIfPresent(organizationId, memberId, dto.parentId);
    const [created] = await this.db
      .insert(document)
      .values({
        organizationId,
        ownerId: memberId,
        title: dto.title,
        parentId: dto.parentId ?? null,
        mimeType: dto.mimeType ?? "text/plain",
        content: dto.content ?? null,
      })
      .returning();
    return created;
  }

  private async requireParentIfPresent(
    organizationId: string,
    memberId: string,
    parentId?: string | null,
  ) {
    if (parentId) {
      const parent = await this.requireWritable(organizationId, parentId, memberId);
      if (parent.mimeType !== "application/x-directory" || parent.deletedAt)
        throw new BadRequestException("Choose an active folder.");
    }
  }

  async update(
    organizationId: string,
    documentId: string,
    memberId: string,
    dto: UpdateDocumentDto,
  ) {
    await this.requireWritable(organizationId, documentId, memberId);
    await this.requireParentIfPresent(organizationId, memberId, dto.parentId);

    return this.db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${organizationId}))`);
      const [current] = await tx
        .select()
        .from(document)
        .where(and(eq(document.id, documentId), eq(document.organizationId, organizationId)))
        .for("update");

      if (!current) throw new NotFoundException("Document not found");
      if (current.deletedAt)
        throw new BadRequestException("Restore this document before editing it.");
      if (current.objectKey && dto.content !== undefined)
        throw new BadRequestException("Uploaded files cannot be edited as text.");
      let parentId = dto.parentId;
      const visited = new Set([documentId]);
      while (parentId) {
        if (visited.has(parentId))
          throw new BadRequestException("A folder cannot contain itself or an ancestor.");
        visited.add(parentId);
        const [ancestor] = await tx
          .select()
          .from(document)
          .where(and(eq(document.id, parentId), eq(document.organizationId, organizationId)));
        if (!ancestor || ancestor.deletedAt)
          throw new BadRequestException("Parent folder is unavailable.");
        parentId = ancestor.parentId;
      }

      const versions = await tx
        .select({ id: documentVersion.id })
        .from(documentVersion)
        .where(eq(documentVersion.documentId, documentId));

      await tx.insert(documentVersion).values({
        documentId,
        version: String(versions.length + 1),
        title: current.title,
        content: current.content,
        objectKey: current.objectKey,
        mimeType: current.mimeType,
        fileSize: current.fileSize,
        createdById: memberId,
      });

      const [updated] = await tx
        .update(document)
        .set({ ...dto, updatedAt: new Date() })
        .where(and(eq(document.id, documentId), eq(document.organizationId, organizationId)))
        .returning();

      return updated;
    });
  }

  async versions(organizationId: string, documentId: string, memberId: string) {
    await this.requireReadable(organizationId, documentId, memberId);
    return this.db.query.documentVersion.findMany({
      where: eq(documentVersion.documentId, documentId),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
    });
  }

  async restoreVersion(
    organizationId: string,
    documentId: string,
    versionId: string,
    memberId: string,
  ) {
    await this.requireWritable(organizationId, documentId, memberId);
    const version = await this.db.query.documentVersion.findFirst({
      where: and(eq(documentVersion.id, versionId), eq(documentVersion.documentId, documentId)),
    });
    if (!version) throw new NotFoundException("Document version not found");
    if (!version.objectKey)
      return this.update(organizationId, documentId, memberId, {
        title: version.title,
        content: version.content ?? "",
      });
    return this.saveFileVersion(organizationId, documentId, memberId, {
      title: version.title,
      objectKey: version.objectKey,
      mimeType: version.mimeType,
      fileSize: version.fileSize,
    });
  }

  async setPermission(
    organizationId: string,
    documentId: string,
    memberId: string,
    dto: SetDocumentPermissionDto,
  ) {
    await this.requireAdmin(organizationId, documentId, memberId);
    await this.requireMember(organizationId, dto.subjectId);
    const [created] = await this.db
      .insert(documentPermission)
      .values({
        documentId,
        subjectKind: dto.subjectKind,
        subjectId: dto.subjectId,
        access: dto.access,
      })
      .onConflictDoUpdate({
        target: [
          documentPermission.documentId,
          documentPermission.subjectKind,
          documentPermission.subjectId,
        ],
        set: { access: dto.access },
      })
      .returning();
    return created;
  }

  async getPermissions(organizationId: string, documentId: string, memberId: string) {
    await this.requireReadable(organizationId, documentId, memberId);
    return this.db.query.documentPermission.findMany({
      where: eq(documentPermission.documentId, documentId),
    });
  }

  async deletePermission(
    organizationId: string,
    documentId: string,
    memberId: string,
    subjectKind: string,
    subjectId: string,
  ) {
    await this.requireAdmin(organizationId, documentId, memberId);
    const [deleted] = await this.db
      .delete(documentPermission)
      .where(
        and(
          eq(documentPermission.documentId, documentId),
          eq(documentPermission.subjectKind, subjectKind),
          eq(documentPermission.subjectId, subjectId),
        ),
      )
      .returning();
    if (!deleted) throw new NotFoundException("Document permission not found");
    return deleted;
  }

  async replaceFile(org: string, id: string, memberId: string, uploadedId: string) {
    if (id === uploadedId)
      throw new BadRequestException("Choose a new upload to replace this file.");
    await this.requireWritable(org, id, memberId);
    return this.saveFileVersion(org, id, memberId, undefined, uploadedId);
  }

  private async saveFileVersion(
    org: string,
    id: string,
    memberId: string,
    restored?: { title: string; objectKey: string; mimeType: string; fileSize: number },
    uploadedId?: string,
  ) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${org}))`);
      const [current] = await tx
        .select()
        .from(document)
        .where(and(eq(document.id, id), eq(document.organizationId, org)))
        .for("update");
      if (!current?.objectKey || current.deletedAt || !current.uploadReady)
        throw new BadRequestException("Choose an active uploaded file.");
      let replacement = restored;
      if (uploadedId) {
        const [upload] = await tx
          .select()
          .from(document)
          .where(and(eq(document.id, uploadedId), eq(document.organizationId, org)))
          .for("update");
        if (
          !upload?.objectKey ||
          !upload.uploadReady ||
          upload.deletedAt ||
          upload.ownerId !== memberId
        )
          throw new BadRequestException(
            "Choose a completed upload that you own in this workspace.",
          );
        const history = await tx
          .select({ id: documentVersion.id })
          .from(documentVersion)
          .where(eq(documentVersion.documentId, uploadedId))
          .limit(1);
        const shares = await tx
          .select({ id: documentPermission.documentId })
          .from(documentPermission)
          .where(eq(documentPermission.documentId, uploadedId))
          .limit(1);
        if (history.length || shares.length)
          throw new BadRequestException(
            "Upload a new file instead of moving an existing shared or versioned file.",
          );
        replacement = {
          title: current.title,
          objectKey: upload.objectKey,
          mimeType: upload.mimeType,
          fileSize: upload.fileSize,
        };
      }
      if (!replacement) throw new BadRequestException("A replacement file is required.");
      const versions = await tx
        .select({ id: documentVersion.id })
        .from(documentVersion)
        .where(eq(documentVersion.documentId, id));
      await tx
        .insert(documentVersion)
        .values({
          documentId: id,
          version: String(versions.length + 1),
          title: current.title,
          content: current.content,
          objectKey: current.objectKey,
          mimeType: current.mimeType,
          fileSize: current.fileSize,
          createdById: memberId,
        });
      const [updated] = await tx
        .update(document)
        .set({ ...replacement, content: null, updatedAt: new Date() })
        .where(eq(document.id, id))
        .returning();
      if (uploadedId) await tx.delete(document).where(eq(document.id, uploadedId));
      return updated;
    });
  }

  private async requireReadable(organizationId: string, documentId: string, memberId: string) {
    const found = await this.findDocument(organizationId, documentId);
    if (!found.uploadReady) throw new NotFoundException("Upload is not complete");
    await this.requireMember(organizationId, memberId);
    if (found.ownerId === null || found.ownerId === memberId) return found;
    if (!(await this.hasPermission(documentId, memberId, ["read", "write", "admin"]))) {
      throw new ForbiddenException("Document access denied");
    }
    return found;
  }

  private async findDocument(organizationId: string, documentId: string) {
    const found = await this.db.query.document.findFirst({
      where: and(eq(document.id, documentId), eq(document.organizationId, organizationId)),
    });
    if (!found) throw new NotFoundException("Document not found");
    return found;
  }

  private hasPermission(documentId: string, memberId: string, access: string[]) {
    return this.db.query.documentPermission
      .findFirst({
        where: and(
          eq(documentPermission.documentId, documentId),
          eq(documentPermission.subjectKind, "member"),
          eq(documentPermission.subjectId, memberId),
        ),
      })
      .then((permission) => Boolean(permission && access.includes(permission.access)));
  }

  private async requireWritable(organizationId: string, documentId: string, memberId: string) {
    const found = await this.requireReadable(organizationId, documentId, memberId);
    if (found.ownerId === null || found.ownerId === memberId) return found;
    if (!(await this.hasPermission(documentId, memberId, ["write", "admin"]))) {
      throw new ForbiddenException("Document write access denied");
    }
    return found;
  }

  private requireMember(organizationId: string, memberId: string) {
    return requireOrganizationMember(this.db, organizationId, memberId);
  }

  private async requireAdmin(org: string, id: string, memberId: string) {
    const found = await this.requireReadable(org, id, memberId);
    if (found.ownerId !== memberId && !(await this.hasPermission(id, memberId, ["admin"])))
      throw new ForbiddenException(
        "Only the owner or a document administrator can manage this file.",
      );
    return found;
  }

  async upload(org: string, memberId: string, dto: UploadDocumentDto) {
    await this.requireMember(org, memberId);
    await this.requireParentIfPresent(org, memberId, dto.parentId);
    if (dto.mimeType === "application/x-directory")
      throw new BadRequestException("Folders cannot be uploaded as files.");
    const id = generateId();
    const objectKey = `${org}/documents/${memberId}/${id}`;
    const target = await this.storage.createUploadUrl({
      key: objectKey,
      contentType: dto.mimeType,
    });
    await this.db
      .insert(document)
      .values({
        id,
        organizationId: org,
        ownerId: memberId,
        title: dto.title,
        mimeType: dto.mimeType,
        fileSize: dto.fileSize,
        parentId: dto.parentId ?? null,
        objectKey,
        uploadReady: false,
      });
    return { ...target, id };
  }

  async confirmUpload(org: string, id: string, memberId: string) {
    const found = await this.findDocument(org, id);
    if (found.ownerId !== memberId || !found.objectKey)
      throw new ForbiddenException("Upload access denied");
    if ((await this.storage.objectSize(found.objectKey)) !== found.fileSize)
      throw new BadRequestException("Uploaded file size does not match.");
    const [updated] = await this.db
      .update(document)
      .set({ uploadReady: true, updatedAt: new Date() })
      .where(eq(document.id, id))
      .returning();
    return updated;
  }

  async download(org: string, id: string, memberId: string) {
    const found = await this.requireReadable(org, id, memberId);
    if (found.deletedAt || !found.objectKey)
      throw new BadRequestException("This file is not available for download.");
    return this.storage.createDownloadUrl(found.objectKey, found.title);
  }

  async trash(org: string, id: string, memberId: string, restore = false) {
    await this.requireAdmin(org, id, memberId);
    const children = await this.db.query.document.findFirst({ where: eq(document.parentId, id) });
    if (!restore && children)
      throw new BadRequestException("Move the folder's contents before moving it to trash.");
    const [updated] = await this.db
      .update(document)
      .set({ deletedAt: restore ? null : new Date(), updatedAt: new Date() })
      .where(and(eq(document.organizationId, org), eq(document.id, id)))
      .returning();
    return updated;
  }

  async purge(org: string, id: string, memberId: string) {
    const found = await this.requireAdmin(org, id, memberId);
    if (!found.deletedAt) throw new BadRequestException("Move the file to trash first.");
    const versions = await this.db.query.documentVersion.findMany({
      where: eq(documentVersion.documentId, id),
      columns: { objectKey: true },
    });
    await this.db
      .delete(document)
      .where(and(eq(document.organizationId, org), eq(document.id, id)));
    const keys = new Set(
      [found.objectKey, ...versions.map((version) => version.objectKey)].filter(
        (key): key is string => !!key,
      ),
    );
    for (const key of keys) {
      try {
        await this.storage.deleteObject(key);
      } catch {
        new Logger(DocumentService.name).warn(
          "A deleted document's stored object could not be cleaned up.",
        );
      }
    }
    return { success: true };
  }
}
