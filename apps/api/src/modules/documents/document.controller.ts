import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../common/better-auth/session.guard";
import type { SessionMember } from "../../common/types";
import { CurrentMember, OrgMemberGuard, PermissionsGuard, RequirePermission } from "../rbac";
import { DocumentService } from "./document.service";
import { CreateDocumentDto, SetDocumentPermissionDto, UpdateDocumentDto } from "./dto";
@ApiTags("Documents") @ApiBearerAuth() @UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/documents")
export class DocumentController {
  constructor(private readonly documents: DocumentService) {}
  @Get() @RequirePermission("docs", "read") list(@Param("orgId") orgId: string) { return this.documents.list(orgId); }
  @Post() @RequirePermission("docs", "create") create(@Param("orgId") orgId: string, @CurrentMember() m: SessionMember, @Body() b: CreateDocumentDto) { return this.documents.create(orgId, m.id, b); }
  @Get(":documentId") @RequirePermission("docs", "read", "documentId") get(@Param("orgId") o: string, @Param("documentId") d: string, @CurrentMember() m: SessionMember) { return this.documents.get(o, d, m.id); }
  @Patch(":documentId") @RequirePermission("docs", "update", "documentId") update(@Param("orgId") o: string, @Param("documentId") d: string, @CurrentMember() m: SessionMember, @Body() b: UpdateDocumentDto) { return this.documents.update(o, d, m.id, b); }
  @Get(":documentId/versions") @RequirePermission("docs", "read", "documentId") versions(@Param("orgId") o: string, @Param("documentId") d: string, @CurrentMember() m: SessionMember) { return this.documents.versions(o, d, m.id); }
  @Post(":documentId/versions/:versionId/restore") @RequirePermission("docs", "update", "documentId") restore(@Param("orgId") o: string, @Param("documentId") d: string, @Param("versionId") v: string, @CurrentMember() m: SessionMember) { return this.documents.restoreVersion(o, d, v, m.id); }
  @Post(":documentId/permissions") @RequirePermission("docs", "update", "documentId") permission(@Param("orgId") o: string, @Param("documentId") d: string, @CurrentMember() m: SessionMember, @Body() b: SetDocumentPermissionDto) { return this.documents.setPermission(o, d, m.id, b); }
  @Post(":documentId/upload") @RequirePermission("docs", "update", "documentId") upload(@Param("orgId") o: string, @Param("documentId") d: string, @CurrentMember() m: SessionMember) { return this.documents.createUpload(o, d, m.id); }
  @Get(":documentId/download") @RequirePermission("docs", "read", "documentId") download(@Param("orgId") o: string, @Param("documentId") d: string, @CurrentMember() m: SessionMember) { return this.documents.createDownload(o, d, m.id); }
}
