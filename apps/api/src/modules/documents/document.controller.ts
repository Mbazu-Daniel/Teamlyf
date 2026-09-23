import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../common/better-auth/session.guard";
import type { SessionMember } from "../../common/types";
import { CurrentMember, OrgMemberGuard, PermissionsGuard, RequirePermission } from "../rbac";
import { CreateDocumentDto, SetDocumentPermissionDto, UpdateDocumentDto } from "./document.dto";
import { DocumentService } from "./document.service";

@ApiTags("Documents")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/documents")
export class DocumentController {
  constructor(private readonly documents: DocumentService) {}

  @Get()
  @RequirePermission("docs", "read")
  list(@Param("orgId") orgId: string, @CurrentMember() member: SessionMember) {
    return this.documents.list(orgId, member.id);
  }

  @Post()
  @RequirePermission("docs", "create")
  create(@Param("orgId") orgId: string, @CurrentMember() member: SessionMember, @Body() body: CreateDocumentDto) {
    return this.documents.create(orgId, member.id, body);
  }

  @Get(":documentId")
  @RequirePermission("docs", "read", "documentId")
  get(@Param("orgId") orgId: string, @Param("documentId") documentId: string, @CurrentMember() member: SessionMember) {
    return this.documents.get(orgId, documentId, member.id);
  }

  @Patch(":documentId")
  @RequirePermission("docs", "update", "documentId")
  update(@Param("orgId") orgId: string, @Param("documentId") documentId: string, @CurrentMember() member: SessionMember, @Body() body: UpdateDocumentDto) {
    return this.documents.update(orgId, documentId, member.id, body);
  }

  @Get(":documentId/versions")
  @RequirePermission("docs", "read", "documentId")
  versions(@Param("orgId") orgId: string, @Param("documentId") documentId: string, @CurrentMember() member: SessionMember) {
    return this.documents.versions(orgId, documentId, member.id);
  }

  @Post(":documentId/permissions")
  @RequirePermission("docs", "update", "documentId")
  permission(@Param("orgId") orgId: string, @Param("documentId") documentId: string, @CurrentMember() member: SessionMember, @Body() body: SetDocumentPermissionDto) {
    return this.documents.setPermission(orgId, documentId, member.id, body);
  }
}