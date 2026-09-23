import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { documentsSchema } from "@teamlyf/db";
import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { DATABASE } from "../../common/db/db.provider";
import type { CreateDocumentDto, SetDocumentPermissionDto, UpdateDocumentDto } from "./document.dto";
import { requireOrganizationMember } from "../../common/organization-member";

const { document, documentPermission, documentVersion } = documentsSchema;

@Injectable()
export class DocumentService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async list(organizationId: string, memberId: string, page = 1, limit = 50) {
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
      ? or(isNull(document.ownerId), eq(document.ownerId, memberId), inArray(document.id, sharedIds))
      : or(isNull(document.ownerId), eq(document.ownerId, memberId));

    return this.db.query.document.findMany({
      where: and(eq(document.organizationId, organizationId), accessCondition),
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
    const [created] = await this.db.insert(document).values({
      organizationId,
      ownerId: memberId,
      title: dto.title,
      parentId: dto.parentId ?? null,
      mimeType: dto.mimeType ?? "text/plain",
      content: dto.content ?? null,
    }).returning();
    return created;
  }

  private async requireParentIfPresent(organizationId: string, memberId: string, parentId?: string | null) {
    if (parentId) await this.requireReadable(organizationId, parentId, memberId);
  }

  async update(organizationId: string, documentId: string, memberId: string, dto: UpdateDocumentDto) {
    await this.requireWritable(organizationId, documentId, memberId);

    return this.db.transaction(async (tx) => {
      const [current] = await tx.select().from(document).where(
        and(eq(document.id, documentId), eq(document.organizationId, organizationId)),
      ).for("update");

      if (!current) throw new NotFoundException("Document not found");

      const versions = await tx.select({ id: documentVersion.id })
        .from(documentVersion)
        .where(eq(documentVersion.documentId, documentId));

      await tx.insert(documentVersion).values({
        documentId,
        version: String(versions.length + 1),
        title: current.title,
        content: current.content,
        createdById: memberId,
      });

      const [updated] = await tx.update(document)
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

  async restoreVersion(organizationId: string, documentId: string, versionId: string, memberId: string) {
    await this.requireWritable(organizationId, documentId, memberId);
    const version = await this.db.query.documentVersion.findFirst({
      where: and(eq(documentVersion.id, versionId), eq(documentVersion.documentId, documentId)),
    });
    if (!version) throw new NotFoundException("Document version not found");
    return this.update(organizationId, documentId, memberId, { title: version.title, content: version.content ?? "" });
  }

  async setPermission(organizationId: string, documentId: string, memberId: string, dto: SetDocumentPermissionDto) {
    await this.requireWritable(organizationId, documentId, memberId);
    await this.requireMember(organizationId, dto.subjectId);
    const [created] = await this.db.insert(documentPermission).values({
      documentId,
      subjectKind: dto.subjectKind,
      subjectId: dto.subjectId,
      access: dto.access,
    }).onConflictDoUpdate({
      target: [documentPermission.documentId, documentPermission.subjectKind, documentPermission.subjectId],
      set: { access: dto.access },
    }).returning();
    return created;
  }

  private async createVersion(documentId: string, memberId: string, title: string, content: string | null) {
    const versions = await this.db.query.documentVersion.findMany({ where: eq(documentVersion.documentId, documentId) });
    await this.db.insert(documentVersion).values({
      documentId,
      version: String(versions.length + 1),
      title,
      content,
      createdById: memberId,
    });
  }

  private async requireReadable(organizationId: string, documentId: string, memberId: string) {
    const found = await this.findDocument(organizationId, documentId);
    await this.requireMember(organizationId, memberId);
    if (found.ownerId === null || found.ownerId === memberId) return found;
    if (!await this.hasPermission(documentId, memberId, ["read", "write", "admin"])) {
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
    return this.db.query.documentPermission.findFirst({
      where: and(
        eq(documentPermission.documentId, documentId),
        eq(documentPermission.subjectKind, "member"),
        eq(documentPermission.subjectId, memberId),
      ),
    }).then((permission) => Boolean(permission && access.includes(permission.access)));
  }

  private async requireWritable(organizationId: string, documentId: string, memberId: string) {
    const found = await this.requireReadable(organizationId, documentId, memberId);
    if (found.ownerId === null || found.ownerId === memberId) return found;
    if (!await this.hasPermission(documentId, memberId, ["write", "admin"])) {
      throw new ForbiddenException("Document write access denied");
    }
    return found;
  }

  private requireMember(organizationId: string, memberId: string) {
    return requireOrganizationMember(this.db, organizationId, memberId);
  }
}
