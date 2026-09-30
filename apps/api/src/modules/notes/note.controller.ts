import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../common/better-auth/session.guard";
import type { SessionMember } from "../../common/types";
import { CurrentMember, OrgMemberGuard, PermissionsGuard, RequirePermission } from "../rbac";
import { CreateNoteDto, UpdateNoteDto, NoteFavoriteDto, RestoreNoteDto } from "./note.dto";
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
  create(
    @Param("orgId") orgId: string,
    @Body() body: CreateNoteDto,
    @CurrentMember() member: SessionMember,
  ) {
    return this.notes.createNote(orgId, member.id, body);
  }

  @Get()
  @RequirePermission("notes", "read")
  @ApiOperation({ summary: "Get notes" })
  @ApiQuery({ name: "parentId", required: false })
  getNotes(
    @Param("orgId") orgId: string,
    @CurrentMember() member: SessionMember,
    @Query("parentId") parentId?: string,
    @Query("all") all?: string,
  ) {
    return this.notes.getNotes(orgId, member.id, parentId, all === "true");
  }

  @Get("search")
  @RequirePermission("notes", "read")
  @ApiOperation({ summary: "Search notes by title" })
  @ApiQuery({ name: "q", required: false, description: "Search term" })
  search(
    @Param("orgId") orgId: string,
    @CurrentMember() member: SessionMember,
    @Query("q") q = "",
  ) {
    return this.notes.searchNotes(orgId, member.id, q);
  }

  @Get("by-task/:taskId")
  @RequirePermission("notes", "read")
  @ApiOperation({ summary: "Get notes linked to a task" })
  @ApiParam({ name: "taskId" })
  byTask(
    @Param("orgId") orgId: string,
    @Param("taskId") taskId: string,
    @CurrentMember() member: SessionMember,
  ) {
    return this.notes.getNotesByTask(orgId, member.id, taskId);
  }

  @Post(":noteId/duplicate")
  @RequirePermission("notes", "create")
  @ApiOperation({ summary: "Duplicate a note" })
  @ApiParam({ name: "noteId" })
  duplicate(
    @Param("orgId") orgId: string,
    @Param("noteId") noteId: string,
    @CurrentMember() member: SessionMember,
  ) {
    return this.notes.duplicateNote(orgId, member.id, noteId);
  }

  @Get(":noteId")
  @RequirePermission("notes", "read", "noteId")
  @ApiParam({ name: "noteId" })
  get(
    @Param("orgId") orgId: string,
    @Param("noteId") noteId: string,
    @CurrentMember() member: SessionMember,
  ) {
    return this.notes.getNote(orgId, member.id, noteId);
  }

  @Patch(":noteId")
  @RequirePermission("notes", "update", "noteId")
  @ApiParam({ name: "noteId" })
  update(
    @Param("orgId") orgId: string,
    @Param("noteId") noteId: string,
    @CurrentMember() member: SessionMember,
    @Body() body: UpdateNoteDto,
  ) {
    return this.notes.updateNote(orgId, member.id, noteId, body);
  }

  @Delete(":noteId")
  @RequirePermission("notes", "delete", "noteId")
  @ApiParam({ name: "noteId" })
  delete(
    @Param("orgId") orgId: string,
    @Param("noteId") noteId: string,
    @CurrentMember() member: SessionMember,
  ) {
    return this.notes.deleteNote(orgId, member.id, noteId);
  }

  @Post(":noteId/favorite")
  @RequirePermission("notes", "read", "noteId")
  favorite(
    @Param("orgId") org: string,
    @Param("noteId") id: string,
    @CurrentMember() member: SessionMember,
    @Body() body: NoteFavoriteDto,
  ) {
    return this.notes.favorite(org, member.id, id, body.enabled);
  }

  @Get(":noteId/snapshots")
  @RequirePermission("notes", "read", "noteId")
  snapshots(
    @Param("orgId") org: string,
    @Param("noteId") id: string,
    @CurrentMember() member: SessionMember,
  ) {
    return this.notes.snapshots(org, member.id, id);
  }

  @Post(":noteId/snapshots/:snapshotId/restore")
  @RequirePermission("notes", "update", "noteId")
  restore(
    @Param("orgId") org: string,
    @Param("noteId") id: string,
    @Param("snapshotId") snapshot: string,
    @CurrentMember() member: SessionMember,
    @Body() body: RestoreNoteDto,
  ) {
    return this.notes.restore(org, member.id, id, snapshot, body.revision);
  }

  @Post(":noteId/presence")
  @RequirePermission("notes", "read", "noteId")
  presence(
    @Param("orgId") org: string,
    @Param("noteId") id: string,
    @CurrentMember() member: SessionMember,
  ) {
    return this.notes.presence(org, member.id, id);
  }
}
