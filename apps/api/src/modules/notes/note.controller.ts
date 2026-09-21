import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../common/better-auth/session.guard";
import type { SessionMember } from "../../common/types";
import { CurrentMember, OrgMemberGuard, PermissionsGuard, RequirePermission } from "../rbac";
import { CreateNoteDto, NoteUpdateDto, UpdateNoteDto } from "./dto";
import { NoteService } from "./note.service";
@ApiTags("Notes") @ApiBearerAuth() @UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/notes")
export class NoteController {
  constructor(private readonly notes: NoteService) {}
  @Get() @RequirePermission("notes", "read") list(@Param("orgId") orgId: string) { return this.notes.list(orgId); }
  @Post() @RequirePermission("notes", "create") create(@Param("orgId") o: string, @CurrentMember() m: SessionMember, @Body() b: CreateNoteDto) { return this.notes.create(o, m.id, b); }
  @Get(":noteId") @RequirePermission("notes", "read", "noteId") get(@Param("orgId") o: string, @Param("noteId") n: string) { return this.notes.get(o, n); }
  @Patch(":noteId") @RequirePermission("notes", "update", "noteId") update(@Param("orgId") o: string, @Param("noteId") n: string, @Body() b: UpdateNoteDto) { return this.notes.update(o, n, b); }
  @Get(":noteId/updates") @RequirePermission("notes", "read", "noteId") updates(@Param("orgId") o: string, @Param("noteId") n: string) { return this.notes.listUpdates(o, n); }
  @Post(":noteId/updates") @RequirePermission("notes", "update", "noteId") append(@Param("orgId") o: string, @Param("noteId") n: string, @Body() b: NoteUpdateDto) { return this.notes.appendUpdate(o, n, b.update); }
}
