import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../common/better-auth/session.guard";
import { OrgMemberGuard, PermissionsGuard, RequirePermission } from "../rbac";
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
  create(@Param("orgId") orgId: string, @Body() body: CreateNoteDto, @Query("memberId") memberId: string) {
    return this.notes.createNote(orgId, memberId, body);
  }

  @Get()
  @RequirePermission("notes", "read")
  @ApiOperation({ summary: "List notes" })
  @ApiQuery({ name: "parentId", required: false })
  list(@Param("orgId") orgId: string, @Query("memberId") memberId: string, @Query("parentId") parentId?: string) {
    return this.notes.getNotes(orgId, memberId, parentId);
  }

  @Get(":noteId")
  @RequirePermission("notes", "read", "noteId")
  @ApiParam({ name: "noteId" })
  get(@Param("orgId") orgId: string, @Param("noteId") noteId: string, @Query("memberId") memberId: string) {
    return this.notes.getNote(orgId, memberId, noteId);
  }

  @Patch(":noteId")
  @RequirePermission("notes", "update", "noteId")
  @ApiParam({ name: "noteId" })
  update(@Param("orgId") orgId: string, @Param("noteId") noteId: string, @Query("memberId") memberId: string, @Body() body: UpdateNoteDto) {
    return this.notes.updateNote(orgId, memberId, noteId, body);
  }

  @Delete(":noteId")
  @RequirePermission("notes", "delete", "noteId")
  @ApiParam({ name: "noteId" })
  delete(@Param("orgId") orgId: string, @Param("noteId") noteId: string, @Query("memberId") memberId: string) {
    return this.notes.deleteNote(orgId, memberId, noteId);
  }
}
