import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Inject,
} from "@nestjs/common";
import {
  type Database,
  note,
  noteSnapshot,
  noteFavorite,
  notePresence,
  project,
  task,
  member,
  user,
} from "@teamlyf/db";
import { and, desc, eq, gt, ilike, isNull, or, sql } from "drizzle-orm";
import { DATABASE } from "../../common/db/db.provider";
import { requireOrganizationMemberOrNotFound } from "../../common/organization-member";
import type { CreateNoteDto, UpdateNoteDto } from "./note.dto";

@Injectable()
export class NoteService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}
  private visibility(org: string, memberId: string) {
    return and(
      eq(note.organizationId, org),
      or(eq(note.private, false), eq(note.ownerId, memberId)),
    );
  }
  private async requireNote(org: string, id: string, memberId: string) {
    const found = await this.db.query.note.findFirst({
      where: and(eq(note.id, id), this.visibility(org, memberId)),
    });
    if (!found) throw new NotFoundException("Note not found");
    return found;
  }
  private async requireTask(org: string, taskId: string) {
    const [row] = await this.db
      .select({ id: task.id })
      .from(task)
      .innerJoin(project, eq(task.projectId, project.id))
      .where(and(eq(task.id, taskId), eq(project.organizationId, org)));
    if (!row) throw new NotFoundException("Task not found");
  }
  async createNote(org: string, memberId: string, dto: CreateNoteDto) {
    await requireOrganizationMemberOrNotFound(this.db, org, memberId);
    const parent = dto.parentId ? await this.requireNote(org, dto.parentId, memberId) : null;
    if (dto.taskId) await this.requireTask(org, dto.taskId);
    if (!dto.title.trim()) throw new BadRequestException("Enter a note title.");
    const [created] = await this.db
      .insert(note)
      .values({
        organizationId: org,
        ownerId: memberId,
        parentId: dto.parentId ?? null,
        taskId: dto.taskId ?? null,
        title: dto.title.trim(),
        content: dto.content ?? "",
        private: parent?.private || dto.private || false,
      })
      .returning();
    return created;
  }
  async getNotes(org: string, memberId: string, parentId?: string, all = false) {
    await requireOrganizationMemberOrNotFound(this.db, org, memberId);
    if (parentId) await this.requireNote(org, parentId, memberId);
    const rows = await this.db.query.note.findMany({
      where: and(
        this.visibility(org, memberId),
        all ? undefined : parentId ? eq(note.parentId, parentId) : isNull(note.parentId),
      ),
      orderBy: [desc(note.updatedAt)],
    });
    const favorites = await this.db
      .select()
      .from(noteFavorite)
      .where(eq(noteFavorite.memberId, memberId));
    const ids = new Set(favorites.map((item) => item.noteId));
    return rows.map((row) => ({ ...row, favorite: ids.has(row.id) }));
  }
  async getNote(org: string, memberId: string, id: string) {
    await requireOrganizationMemberOrNotFound(this.db, org, memberId);
    return this.requireNote(org, id, memberId);
  }
  async updateNote(org: string, memberId: string, id: string, dto: UpdateNoteDto) {
    await requireOrganizationMemberOrNotFound(this.db, org, memberId);
    await this.requireNote(org, id, memberId);
    if (dto.taskId) await this.requireTask(org, dto.taskId);
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${org}))`);
      const [current] = await tx
        .select()
        .from(note)
        .where(and(eq(note.id, id), this.visibility(org, memberId)))
        .for("update");
      if (!current) throw new NotFoundException("Note not found");
      if (dto.revision !== undefined && dto.revision !== current.revision)
        throw new ConflictException(
          "This note changed elsewhere. Reload the latest version before saving; your draft has been kept.",
        );
      if ((dto.content !== undefined || dto.title !== undefined) && dto.revision === undefined)
        throw new ConflictException("Reload this note before saving.");
      if (dto.title !== undefined && !dto.title.trim())
        throw new BadRequestException("Enter a note title.");
      if (dto.private !== undefined && dto.private !== current.private) {
        if (current.ownerId !== memberId)
          throw new ForbiddenException("Only the owner can change note visibility.");
        const child = await tx
          .select({ id: note.id })
          .from(note)
          .where(eq(note.parentId, id))
          .limit(1);
        if (child.length)
          throw new BadRequestException("Move child notes before changing this note's visibility.");
      }
      const parentId = dto.parentId === undefined ? current.parentId : dto.parentId;
      let ancestorId = parentId;
      const visited = new Set([id]);
      while (ancestorId) {
        if (visited.has(ancestorId))
          throw new BadRequestException("A note cannot be moved inside itself or its descendants.");
        visited.add(ancestorId);
        const [ancestor] = await tx
          .select()
          .from(note)
          .where(and(eq(note.id, ancestorId), this.visibility(org, memberId)));
        if (!ancestor) throw new NotFoundException("Parent note not found");
        if (ancestor.private && !(dto.private ?? current.private))
          throw new BadRequestException("A shared note cannot be placed under a private note.");
        ancestorId = ancestor.parentId;
      }
      if (dto.content !== undefined || dto.title !== undefined) {
        await tx.insert(noteSnapshot).values({
          noteId: id,
          revision: current.revision,
          title: current.title,
          content: current.content,
        });
      }
      const { revision: _expected, ...changes } = dto;
      const [updated] = await tx
        .update(note)
        .set({
          ...changes,
          title: dto.title?.trim(),
          revision: current.revision + 1,
          updatedAt: new Date(),
        })
        .where(and(eq(note.id, id), eq(note.organizationId, org)))
        .returning();
      return updated;
    });
  }
  async searchNotes(org: string, memberId: string, q: string) {
    await requireOrganizationMemberOrNotFound(this.db, org, memberId);
    const pattern = "%" + q.replace(/[\\%_]/g, "\\$&") + "%";
    return this.db.query.note.findMany({
      where: and(this.visibility(org, memberId), ilike(note.title, pattern)),
      orderBy: [desc(note.updatedAt)],
      limit: 50,
    });
  }
  async getNotesByTask(org: string, memberId: string, taskId: string) {
    await requireOrganizationMemberOrNotFound(this.db, org, memberId);
    await this.requireTask(org, taskId);
    return this.db.query.note.findMany({
      where: and(this.visibility(org, memberId), eq(note.taskId, taskId)),
      orderBy: [desc(note.updatedAt)],
    });
  }
  async duplicateNote(org: string, memberId: string, id: string) {
    const original = await this.getNote(org, memberId, id);
    return this.createNote(org, memberId, {
      title: original.title + " (Copy)",
      content: original.content,
      private: original.private,
      parentId: original.parentId ?? undefined,
      taskId: original.taskId ?? undefined,
    });
  }
  async deleteNote(org: string, memberId: string, id: string) {
    await this.getNote(org, memberId, id);
    const child = await this.db.query.note.findFirst({
      where: and(eq(note.organizationId, org), eq(note.parentId, id)),
    });
    if (child)
      throw new BadRequestException("Delete or move child notes before deleting this note.");
    await this.db.delete(note).where(and(eq(note.id, id), eq(note.organizationId, org)));
    return { success: true };
  }
  async favorite(org: string, memberId: string, id: string, enabled: boolean) {
    await this.getNote(org, memberId, id);
    if (enabled)
      await this.db.insert(noteFavorite).values({ noteId: id, memberId }).onConflictDoNothing();
    else
      await this.db
        .delete(noteFavorite)
        .where(and(eq(noteFavorite.noteId, id), eq(noteFavorite.memberId, memberId)));
    return { favorite: enabled };
  }
  async snapshots(org: string, memberId: string, id: string) {
    await this.getNote(org, memberId, id);
    return this.db.query.noteSnapshot.findMany({
      where: eq(noteSnapshot.noteId, id),
      orderBy: [desc(noteSnapshot.revision)],
    });
  }
  async restore(org: string, memberId: string, id: string, snapshotId: string, revision: number) {
    await this.getNote(org, memberId, id);
    const snapshot = await this.db.query.noteSnapshot.findFirst({
      where: and(eq(noteSnapshot.noteId, id), eq(noteSnapshot.id, snapshotId)),
    });
    if (!snapshot) throw new NotFoundException("Snapshot not found");
    return this.updateNote(org, memberId, id, {
      title: snapshot.title,
      content: snapshot.content,
      revision,
    });
  }
  async presence(org: string, memberId: string, id: string) {
    await this.getNote(org, memberId, id);
    await this.db
      .insert(notePresence)
      .values({ noteId: id, memberId, lastSeen: new Date() })
      .onConflictDoUpdate({
        target: [notePresence.noteId, notePresence.memberId],
        set: { lastSeen: new Date() },
      });
    return this.db
      .select({ id: member.id, name: user.name })
      .from(notePresence)
      .innerJoin(member, eq(member.id, notePresence.memberId))
      .innerJoin(user, eq(user.id, member.userId))
      .where(
        and(eq(notePresence.noteId, id), gt(notePresence.lastSeen, new Date(Date.now() - 45000))),
      );
  }
}
