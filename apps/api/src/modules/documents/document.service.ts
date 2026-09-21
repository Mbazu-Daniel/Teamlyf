import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { document, documentPermission, documentVersion } from "@teamlyf/db/workspace-schema";
import { and, eq, inArray } from "drizzle-orm";
import { DATABASE } from "../../common/db/db.provider";
import { TenantScopedRepository } from "../../common/db/tenant-scoped.repository";
import { DocumentStorageService } from "./document-storage.service";
import type { CreateDocumentDto, SetDocumentPermissionDto, UpdateDocumentDto } from "./dto";

@Injectable()
export class DocumentService extends TenantScopedRepository {
  constructor(@Inject(DATABASE) private readonly db: Database, private readonly storage: DocumentStorageService) { super(); }
  list(organizationId: string) { return this.db.query.document.findMany({ where: eq(document.organizationId, this.assertOrganizationId(organizationId)), orderBy: (t, { desc }) => [desc(t.updatedAt)] }); }
  async get(organizationId: string, documentId: string, memberId: string) { const found = await this.requireReadable(organizationId, documentId, memberId); return found; }
  async create(organizationId: string, memberId: string, dto: CreateDocumentDto) {
    if (dto.parentId) await this.requireReadable(organizationId, dto.parentId, memberId);
    const [created] = await this.db.insert(document).values({ organizationId, ownerId: memberId, title: dto.title, parentId: dto.parentId ?? null, mimeType: dto.mimeType ?? "text/plain", content: dto.content ?? null }).returning();
    return created;
  }
  async update(organizationId: string, documentId: string, memberId: string, dto: UpdateDocumentDto) {
    const current = await this.requireWritable(organizationId, documentId, memberId);
    const latest = await this.db.query.documentVersion.findFirst({ where: eq(documentVersion.documentId, documentId), orderBy: (t, { desc }) => [desc(t.createdAt)] });
    await this.db.insert(documentVersion).values({ documentId, version: String(Number(latest?.version ?? "0") + 1), title: current.title, content: current.content, createdById: memberId });
    const [updated] = await this.db.update(document).set({ ...dto, updatedAt: new Date() }).where(and(eq(document.id, documentId), eq(document.organizationId, organizationId))).returning();
    return updated;
  }
  async versions(organizationId: string, documentId: string, memberId: string) { await this.requireReadable(organizationId, documentId, memberId); return this.db.query.documentVersion.findMany({ where: eq(documentVersion.documentId, documentId), orderBy: (t, { desc }) => [desc(t.createdAt)] }); }
  async restoreVersion(organizationId: string, documentId: string, versionId: string, memberId: string) { await this.requireWritable(organizationId, documentId, memberId); const version = this.requireScoped(await this.db.query.documentVersion.findFirst({ where: and(eq(documentVersion.id, versionId), eq(documentVersion.documentId, documentId)) }), "Document version"); return this.update(organizationId, documentId, memberId, { title: version.title, content: version.content ?? "" }); }
  async setPermission(organizationId: string, documentId: string, memberId: string, dto: SetDocumentPermissionDto) {
    await this.requireWritable(organizationId, documentId, memberId);
    const [created] = await this.db.insert(documentPermission).values({ documentId, ...dto }).returning();
    return created;
  }
  async createUpload(organizationId: string, documentId: string, memberId: string) {
    const found = await this.requireWritable(organizationId, documentId, memberId);
    const key = `${organizationId}/documents/${documentId}/${Date.now()}`;
    const url = await this.storage.uploadUrl(key, found.mimeType);
    await this.db.update(document).set({ objectKey: key, updatedAt: new Date() }).where(eq(document.id, documentId));
    return { key, url, expiresInSeconds: 900 };
  }
  async createDownload(organizationId: string, documentId: string, memberId: string) {
    const found = await this.requireReadable(organizationId, documentId, memberId);
    if (!found.objectKey) return { content: found.content, mimeType: found.mimeType };
    return { url: await this.storage.downloadUrl(found.objectKey), expiresInSeconds: 900 };
  }
  private async requireReadable(organizationId: string, documentId: string, memberId: string) {
    const found = this.requireScoped(await this.db.query.document.findFirst({ where: and(eq(document.id, documentId), eq(document.organizationId, this.assertOrganizationId(organizationId))) }), "Document");
    const access = await this.resolveAccess(found, memberId);
    if (access === "none") throw new ForbiddenException("Document access denied");
    return found;
  }
  private async requireWritable(organizationId: string, documentId: string, memberId: string) {
    const found = await this.requireReadable(organizationId, documentId, memberId);
    const access = await this.resolveAccess(found, memberId);
    if (found.ownerId !== memberId && !["write", "admin"].includes(access)) throw new ForbiddenException("Document write access denied");
    return found;
  }
  private async resolveAccess(found: typeof document.$inferSelect, memberId: string): Promise<string> {
    if (found.ownerId === memberId) return "admin";
    const ancestry = [found.id]; let parentId = found.parentId;
    while (parentId) { const parent = await this.db.query.document.findFirst({ where: eq(document.id, parentId) }); if (!parent) break; ancestry.push(parent.id); parentId = parent.parentId; }
    const permissions = await this.db.query.documentPermission.findMany({ where: and(inArray(documentPermission.documentId, ancestry), eq(documentPermission.subjectKind, "member"), eq(documentPermission.subjectId, memberId)) });
    return permissions.sort((a, b) => ancestry.indexOf(a.documentId) - ancestry.indexOf(b.documentId))[0]?.access ?? "read";
  }
}
