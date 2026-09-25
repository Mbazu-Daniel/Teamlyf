import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { note, project, task } from "@teamlyf/db";
import { and, eq, ilike, isNull } from "drizzle-orm";
import { DATABASE } from "../../common/db/db.provider";
import { requireOrganizationMemberOrNotFound } from "../../common/organization-member";
import type { CreateNoteDto, UpdateNoteDto } from "./note.dto";

@Injectable()
export class NoteService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  private async requireNote(orgId: string, noteId: string) {
    const found = await this.db.query.note.findFirst({
      where: and(eq(note.id, noteId), eq(note.organizationId, orgId)),
    });
    if (!found) throw new NotFoundException("Note not found");
    return found;
  }

  /** Tasks live under projects; org scope is proven through the project join. */
  private async requireTask(orgId: string, taskId: string) {
    const [row] = await this.db
      .select({ id: task.id })
      .from(task)
      .innerJoin(project, eq(task.projectId, project.id))
      .where(and(eq(task.id, taskId), eq(project.organizationId, orgId)));
    if (!row) throw new NotFoundException("Task not found");
    return row.id;
  }

  async createNote(orgId: string, memberId: string, dto: CreateNoteDto) {
    await requireOrganizationMemberOrNotFound(this.db, orgId, memberId);
    if (dto.parentId) await this.requireNote(orgId, dto.parentId);
    if (dto.taskId) await this.requireTask(orgId, dto.taskId);
    const [created] = await this.db.insert(note).values(noteValues(orgId, memberId, dto)).returning();
    return created;
  }

  async getNotes(orgId: string, memberId: string, parentId?: string) {
    await requireOrganizationMemberOrNotFound(this.db, orgId, memberId);
    if (parentId) await this.requireNote(orgId, parentId);
    return this.db.query.note.findMany({
      where: parentId
        ? and(eq(note.organizationId, orgId), eq(note.parentId, parentId))
        : and(eq(note.organizationId, orgId), isNull(note.parentId)),
      orderBy: (n, { desc }) => [desc(n.updatedAt)],
    });
  }

  async getNote(orgId: string, memberId: string, noteId: string) {
    await requireOrganizationMemberOrNotFound(this.db, orgId, memberId);
    return this.requireNote(orgId, noteId);
  }

  async updateNote(orgId: string, memberId: string, noteId: string, dto: UpdateNoteDto) {
    await requireOrganizationMemberOrNotFound(this.db, orgId, memberId);
    await this.requireNote(orgId, noteId);
    if (dto.parentId) {
      if (dto.parentId === noteId) throw new BadRequestException("A note cannot be its own parent");
      await this.requireNote(orgId, dto.parentId);
    }
    if (dto.taskId) await this.requireTask(orgId, dto.taskId);
    const [updated] = await this.db.update(note).set({
      title: dto.title, content: dto.content, parentId: dto.parentId, taskId: dto.taskId, updatedAt: new Date(),
    }).where(and(eq(note.id, noteId), eq(note.organizationId, orgId))).returning();
    return updated;
  }

  async searchNotes(orgId: string, memberId: string, q: string) {
    await requireOrganizationMemberOrNotFound(this.db, orgId, memberId);
    const pattern = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
    return this.db.query.note.findMany({
      where: and(eq(note.organizationId, orgId), ilike(note.title, pattern)),
      orderBy: (n, { desc }) => [desc(n.updatedAt)],
      limit: 50,
    });
  }

  async getNotesByTask(orgId: string, memberId: string, taskId: string) {
    await requireOrganizationMemberOrNotFound(this.db, orgId, memberId);
    await this.requireTask(orgId, taskId);
    return this.db.query.note.findMany({
      where: and(eq(note.organizationId, orgId), eq(note.taskId, taskId)),
      orderBy: (n, { desc }) => [desc(n.updatedAt)],
    });
  }

  async duplicateNote(orgId: string, memberId: string, noteId: string) {
    await requireOrganizationMemberOrNotFound(this.db, orgId, memberId);
    const original = await this.requireNote(orgId, noteId);
    const [created] = await this.db.insert(note).values({
      organizationId: orgId,
      ownerId: memberId,
      parentId: original.parentId,
      taskId: original.taskId,
      title: `${original.title} (Copy)`,
      content: original.content,
    }).returning();
    return created;
  }

  async deleteNote(orgId: string, memberId: string, noteId: string) {
    await requireOrganizationMemberOrNotFound(this.db, orgId, memberId);
    await this.requireNote(orgId, noteId);
    const children = await this.db.query.note.findFirst({
      where: and(eq(note.organizationId, orgId), eq(note.parentId, noteId)),
    });
    if (children) throw new BadRequestException("Delete child notes before deleting this note");
    await this.db.delete(note).where(and(eq(note.id, noteId), eq(note.organizationId, orgId)));
  }
}

/**
 * The insert row, with every optional column written as an explicit null rather
 * than left off the statement, so a note always has all four columns present.
 */
function noteValues(orgId: string, memberId: string, dto: CreateNoteDto) {
  return {
    organizationId: orgId,
    ownerId: memberId,
    parentId: dto.parentId ?? null,
    taskId: dto.taskId ?? null,
    title: dto.title,
    content: dto.content ?? "",
  };
}
