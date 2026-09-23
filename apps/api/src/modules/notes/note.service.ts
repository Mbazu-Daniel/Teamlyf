import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { member, note } from "@teamlyf/db";
import { and, eq, isNull } from "drizzle-orm";
import { DATABASE } from "../../common/db/db.provider";
import type { CreateNoteDto, UpdateNoteDto } from "./note.dto";

@Injectable()
export class NoteService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  private async requireMember(orgId: string, memberId: string) {
    const found = await this.db.query.member.findFirst({
      where: and(eq(member.id, memberId), eq(member.organizationId, orgId)),
    });
    if (!found) throw new NotFoundException("Member not found in organization");
    return found;
  }

  private async requireNote(orgId: string, noteId: string) {
    const found = await this.db.query.note.findFirst({
      where: and(eq(note.id, noteId), eq(note.organizationId, orgId)),
    });
    if (!found) throw new NotFoundException("Note not found");
    return found;
  }

  async createNote(orgId: string, memberId: string, dto: CreateNoteDto) {
    await this.requireMember(orgId, memberId);
    if (dto.parentId) await this.requireNote(orgId, dto.parentId);

    const [created] = await this.db.insert(note).values({
      organizationId: orgId,
      ownerId: memberId,
      parentId: dto.parentId ?? null,
      title: dto.title,
      content: dto.content ?? "",
    }).returning();

    return created;
  }

  async getNotes(orgId: string, memberId: string, parentId?: string) {
    await this.requireMember(orgId, memberId);
    if (parentId) await this.requireNote(orgId, parentId);

    return this.db.query.note.findMany({
      where: parentId
        ? and(eq(note.organizationId, orgId), eq(note.parentId, parentId))
        : and(eq(note.organizationId, orgId), isNull(note.parentId)),
      orderBy: (n, { desc }) => [desc(n.updatedAt)],
    });
  }

  async getNote(orgId: string, memberId: string, noteId: string) {
    await this.requireMember(orgId, memberId);
    return this.requireNote(orgId, noteId);
  }

  async updateNote(orgId: string, memberId: string, noteId: string, dto: UpdateNoteDto) {
    await this.requireMember(orgId, memberId);
    await this.requireNote(orgId, noteId);
    if (dto.parentId) {
      if (dto.parentId === noteId) throw new BadRequestException("A note cannot be its own parent");
      await this.requireNote(orgId, dto.parentId);
    }

    const [updated] = await this.db.update(note).set({
      title: dto.title,
      content: dto.content,
      parentId: dto.parentId,
      updatedAt: new Date(),
    }).where(and(eq(note.id, noteId), eq(note.organizationId, orgId))).returning();

    return updated;
  }

  async deleteNote(orgId: string, memberId: string, noteId: string) {
    await this.requireMember(orgId, memberId);
    await this.requireNote(orgId, noteId);
    const children = await this.db.query.note.findFirst({
      where: and(eq(note.organizationId, orgId), eq(note.parentId, noteId)),
    });
    if (children) throw new BadRequestException("Delete child notes before deleting this note");

    await this.db.delete(note).where(and(eq(note.id, noteId), eq(note.organizationId, orgId)));
  }
}
