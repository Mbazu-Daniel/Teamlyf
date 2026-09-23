import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../common/better-auth/session.guard";
import type { SessionMember } from "../../common/types";
import { CurrentMember, OrgMemberGuard, PermissionsGuard, RequirePermission } from "../rbac";
import { CreateNoteDto, UpdateNoteDto } from "./note.dto";
import { NoteService } from "./note.service";

@ApiTags("Notes")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/notes")
export class NoteController {
  constructor(private readonly notes: NoteService) {}

  @Post()
  @RequirePermission("notes", "create")
  @ApiOperation({ summary: "Create a note" })
  create(@Param("orgId") orgId: string, @Body() body: CreateNoteDto, @CurrentMember() member: SessionMember) {
    return this.notes.createNote(orgId, member.id, body);
  }

  @Get()
  @RequirePermission("notes", "read")
  @ApiOperation({ summary: "List notes" })
  @ApiQuery({ name: "parentId", required: false })
  list(@Param("orgId") orgId: string, @CurrentMember() member: SessionMember, @Query("parentId") parentId?: string) {
    return this.notes.getNotes(orgId, member.id, parentId);
  }

  @Get(":noteId")
  @RequirePermission("notes", "read", "noteId")
  @ApiParam({ name: "noteId" })
  get(@Param("orgId") orgId: string, @Param("noteId") noteId: string, @CurrentMember() member: SessionMember) {
    return this.notes.getNote(orgId, member.id, noteId);
  }

  @Patch(":noteId")
  @RequirePermission("notes", "update", "noteId")
  @ApiParam({ name: "noteId" })
  update(@Param("orgId") orgId: string, @Param("noteId") noteId: string, @CurrentMember() member: SessionMember, @Body() body: UpdateNoteDto) {
    return this.notes.updateNote(orgId, member.id, noteId, body);
  }

  @Delete(":noteId")
  @RequirePermission("notes", "delete", "noteId")
  @ApiParam({ name: "noteId" })
  delete(@Param("orgId") orgId: string, @Param("noteId") noteId: string, @CurrentMember() member: SessionMember) {
    return this.notes.deleteNote(orgId, member.id, noteId);
  }
}
