import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../common/better-auth/session.guard";
import type { SessionMember } from "../../common/types";
import { CurrentMember, OrgMemberGuard, PermissionsGuard, RequirePermission } from "../rbac";
import {
  CreateDocumentDto,
  ReplaceDocumentFileDto,
  SetDocumentPermissionDto,
  UpdateDocumentDto,
  UploadDocumentDto,
} from "./document.dto";
import { DocumentService } from "./document.service";

@ApiTags("Documents")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/documents")
export class DocumentController {
  constructor(private readonly documents: DocumentService) {}

  @Get()
  @RequirePermission("docs", "read")
  getDocuments(
    @Param("orgId") orgId: string,
    @CurrentMember() member: SessionMember,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.documents.getDocuments(orgId, member.id, page, limit);
  }

  @Post("upload")
  @RequirePermission("docs", "create")
  upload(
    @Param("orgId") org: string,
    @CurrentMember() member: SessionMember,
    @Body() body: UploadDocumentDto,
  ) {
    return this.documents.upload(org, member.id, body);
  }

  @Post(":documentId/confirm-upload")
  @RequirePermission("docs", "create")
  confirm(
    @Param("orgId") org: string,
    @Param("documentId") id: string,
    @CurrentMember() member: SessionMember,
  ) {
    return this.documents.confirmUpload(org, id, member.id);
  }

  @Get(":documentId/download")
  @RequirePermission("docs", "read", "documentId")
  download(
    @Param("orgId") org: string,
    @Param("documentId") id: string,
    @CurrentMember() member: SessionMember,
  ) {
    return this.documents.download(org, id, member.id);
  }

  @Post(":documentId/replace-file")
  @RequirePermission("docs", "update", "documentId")
  replaceFile(
    @Param("orgId") org: string,
    @Param("documentId") id: string,
    @CurrentMember() member: SessionMember,
    @Body() body: ReplaceDocumentFileDto,
  ) {
    return this.documents.replaceFile(org, id, member.id, body.uploadedDocumentId);
  }

  @Post(":documentId/trash")
  @RequirePermission("docs", "update", "documentId")
  trash(
    @Param("orgId") org: string,
    @Param("documentId") id: string,
    @CurrentMember() member: SessionMember,
  ) {
    return this.documents.trash(org, id, member.id);
  }

  @Post(":documentId/restore")
  @RequirePermission("docs", "update", "documentId")
  restore(
    @Param("orgId") org: string,
    @Param("documentId") id: string,
    @CurrentMember() member: SessionMember,
  ) {
    return this.documents.trash(org, id, member.id, true);
  }

  @Delete(":documentId")
  @RequirePermission("docs", "delete", "documentId")
  purge(
    @Param("orgId") org: string,
    @Param("documentId") id: string,
    @CurrentMember() member: SessionMember,
  ) {
    return this.documents.purge(org, id, member.id);
  }

  @Post()
  @RequirePermission("docs", "create")
  create(
    @Param("orgId") orgId: string,
    @CurrentMember() member: SessionMember,
    @Body() body: CreateDocumentDto,
  ) {
    return this.documents.create(orgId, member.id, body);
  }

  @Get(":documentId")
  @RequirePermission("docs", "read", "documentId")
  get(
    @Param("orgId") orgId: string,
    @Param("documentId") documentId: string,
    @CurrentMember() member: SessionMember,
  ) {
    return this.documents.get(orgId, documentId, member.id);
  }

  @Patch(":documentId")
  @RequirePermission("docs", "update", "documentId")
  update(
    @Param("orgId") orgId: string,
    @Param("documentId") documentId: string,
    @CurrentMember() member: SessionMember,
    @Body() body: UpdateDocumentDto,
  ) {
    return this.documents.update(orgId, documentId, member.id, body);
  }

  @Get(":documentId/versions")
  @RequirePermission("docs", "read", "documentId")
  versions(
    @Param("orgId") orgId: string,
    @Param("documentId") documentId: string,
    @CurrentMember() member: SessionMember,
  ) {
    return this.documents.versions(orgId, documentId, member.id);
  }

  @Post(":documentId/versions/:versionId/restore")
  @RequirePermission("docs", "update", "documentId")
  restoreVersion(
    @Param("orgId") orgId: string,
    @Param("documentId") documentId: string,
    @Param("versionId") versionId: string,
    @CurrentMember() member: SessionMember,
  ) {
    return this.documents.restoreVersion(orgId, documentId, versionId, member.id);
  }

  @Post(":documentId/permissions")
  @RequirePermission("docs", "update", "documentId")
  permission(
    @Param("orgId") orgId: string,
    @Param("documentId") documentId: string,
    @CurrentMember() member: SessionMember,
    @Body() body: SetDocumentPermissionDto,
  ) {
    return this.documents.setPermission(orgId, documentId, member.id, body);
  }

  @Get(":documentId/permissions")
  @RequirePermission("docs", "read", "documentId")
  @ApiOperation({ summary: "List a document's permissions" })
  listPermissions(
    @Param("orgId") orgId: string,
    @Param("documentId") documentId: string,
    @CurrentMember() member: SessionMember,
  ) {
    return this.documents.getPermissions(orgId, documentId, member.id);
  }

  @Delete(":documentId/permissions/:subjectKind/:subjectId")
  @RequirePermission("docs", "update", "documentId")
  @ApiOperation({ summary: "Revoke a document permission" })
  removePermission(
    @Param("orgId") orgId: string,
    @Param("documentId") documentId: string,
    @Param("subjectKind") subjectKind: string,
    @Param("subjectId") subjectId: string,
    @CurrentMember() member: SessionMember,
  ) {
    return this.documents.deletePermission(orgId, documentId, member.id, subjectKind, subjectId);
  }
}
