import { IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class CreateDocumentDto {
  @IsString() @MaxLength(255) title!: string;
  @IsOptional() @IsUUID() parentId?: string;
  @IsOptional() @IsString() mimeType?: string;
  @IsOptional() @IsString() content?: string;
}
export class UpdateDocumentDto {
  @IsOptional() @IsString() @MaxLength(255) title?: string;
  @IsOptional() @IsUUID() parentId?: string;
  @IsOptional() @IsString() content?: string;
}
export class SetDocumentPermissionDto {
  @IsString() subjectKind!: "member" | "agent";
  @IsUUID() subjectId!: string;
  @IsString() access!: "read" | "write" | "admin";
}
