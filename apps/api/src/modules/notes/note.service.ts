import { Inject, Injectable } from "@nestjs/common";
import * as Y from "yjs";
import type { Database } from "@teamlyf/db";
import { note, noteUpdate } from "@teamlyf/db/workspace-schema";
import { and, eq } from "drizzle-orm";
import { DATABASE } from "../../common/db/db.provider";
import { TenantScopedRepository } from "../../common/db/tenant-scoped.repository";
import type { CreateNoteDto, UpdateNoteDto } from "./dto";

@Injectable()
export class NoteService extends TenantScopedRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) { super(); }
  list(organizationId: string) { return this.db.query.note.findMany({ where: eq(note.organizationId, this.assertOrganizationId(organizationId)), orderBy: (t, { desc }) => [desc(t.updatedAt)] }); }
  async get(organizationId: string, noteId: string) { return this.requireNote(organizationId, noteId); }
  async create(organizationId: string, memberId: string, dto: CreateNoteDto) {
    if (dto.parentId) await this.requireNote(organizationId, dto.parentId);
    const [created] = await this.db.insert(note).values({ organizationId, createdById: memberId, title: dto.title, parentId: dto.parentId ?? null, linkedTaskId: dto.linkedTaskId ?? null, content: dto.content ?? "" }).returning();
    return created;
  }
  async update(organizationId: string, noteId: string, dto: UpdateNoteDto) {
    await this.requireNote(organizationId, noteId);
    const [updated] = await this.db.update(note).set({ ...dto, updatedAt: new Date() }).where(and(eq(note.id, noteId), eq(note.organizationId, organizationId))).returning();
    return updated;
  }
  async listUpdates(organizationId: string, noteId: string) { await this.requireNote(organizationId, noteId); return this.db.query.noteUpdate.findMany({ where: eq(noteUpdate.noteId, noteId), orderBy: (t, { asc }) => [asc(t.createdAt)] }); }
  async appendUpdate(organizationId: string, noteId: string, encodedUpdate: string) {
    const current = await this.requireNote(organizationId, noteId);
    const update = Buffer.from(encodedUpdate, "base64");
    const doc = new Y.Doc();
    const existing = await this.db.query.noteUpdate.findMany({ where: eq(noteUpdate.noteId, noteId) });
    for (const item of existing) Y.applyUpdate(doc, Buffer.from(item.update, "base64"));
    Y.applyUpdate(doc, update);
    const [stored] = await this.db.insert(noteUpdate).values({ noteId, update: encodedUpdate }).returning();
    // A readable snapshot remains available even when a client has not loaded Yjs.
    const text = doc.getText("content").toString();
    await this.db.update(note).set({ content: text || current.content, updatedAt: new Date() }).where(eq(note.id, noteId));
    return stored;
  }
  private async requireNote(organizationId: string, noteId: string) { return this.requireScoped(await this.db.query.note.findFirst({ where: and(eq(note.id, noteId), eq(note.organizationId, this.assertOrganizationId(organizationId))) }), "Note"); }
}
