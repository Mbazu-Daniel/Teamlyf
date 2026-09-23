import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { documentsSchema } from "@teamlyf/db";
import { and, eq } from "drizzle-orm";
import { DATABASE } from "../../common/db/db.provider";
import type { CreateDocumentDto, SetDocumentPermissionDto, UpdateDocumentDto } from "./document.dto";
import { requireOrganizationMember } from "../../common/organization-member";

const { document, documentPermission, documentVersion } = documentsSchema;

@Injectable()
export class DocumentService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async list(organizationId: string, memberId: string) {
    const rows = await this.db.query.document.findMany({
      where: eq(document.organizationId, organizationId),
      orderBy: (table, { desc }) => [desc(table.updatedAt)],
    });
    const permissions = await this.db.query.documentPermission.findMany({
      where: and(eq(documentPermission.subjectKind, "member"), eq(documentPermission.subjectId, memberId)),
    });
    const shared = new Set(permissions.filter((item) => ["read", "write", "admin"].includes(item.access)).map((item) => item.documentId));
    return rows.filter((row) => row.ownerId === memberId || shared.has(row.id));
  }

  async get(organizationId: string, documentId: string, memberId: string) {
    return this.requireReadable(organizationId, documentId, memberId);
  }

  async create(organizationId: string, memberId: string, dto: CreateDocumentDto) {
    await this.requireMember(organizationId, memberId);
    if (dto.parentId) await this.requireReadable(organizationId, dto.parentId, memberId);
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

  async update(organizationId: string, documentId: string, memberId: string, dto: UpdateDocumentDto) {
    const current = await this.requireWritable(organizationId, documentId, memberId);
    await this.createVersion(current.id, memberId, current.title, current.content);
    const [updated] = await this.db.update(document)
      .set({ ...dto, updatedAt: new Date() })
      .where(and(eq(document.id, documentId), eq(document.organizationId, organizationId)))
      .returning();
    return updated;
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
    const versions = await this.db.query.documentVersion.findMany({
      where: eq(documentVersion.documentId, documentId),
    });
    await this.db.insert(documentVersion).values({
      documentId,
      version: String(versions.length + 1),
      title,
      content,
      createdById: memberId,
    });
  }

  private async requireReadable(organizationId: string, documentId: string, memberId: string) {
    const found = await this.db.query.document.findFirst({
      where: and(eq(document.id, documentId), eq(document.organizationId, organizationId)),
    });
    if (!found) throw new NotFoundException("Document not found");
    await this.requireMember(organizationId, memberId);
    if (found.ownerId === memberId) return found;
    const permission = await this.db.query.documentPermission.findFirst({
      where: and(eq(documentPermission.documentId, documentId), eq(documentPermission.subjectKind, "member"), eq(documentPermission.subjectId, memberId)),
    });
    if (!permission || !["read", "write", "admin"].includes(permission.access)) throw new ForbiddenException("Document access denied");
    return found;
  }

  private async requireWritable(organizationId: string, documentId: string, memberId: string) {
    const found = await this.requireReadable(organizationId, documentId, memberId);
    if (found.ownerId === memberId) return found;
    const permission = await this.db.query.documentPermission.findFirst({
      where: and(eq(documentPermission.documentId, documentId), eq(documentPermission.subjectKind, "member"), eq(documentPermission.subjectId, memberId)),
    });
    if (!permission || !["write", "admin"].includes(permission.access)) throw new ForbiddenException("Document write access denied");
    return found;
  }

  private requireMember(organizationId: string, memberId: string) {
    return requireOrganizationMember(this.db, organizationId, memberId);
  }
}