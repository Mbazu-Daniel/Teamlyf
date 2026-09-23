import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateDocumentDto {
  @IsString() @IsNotEmpty() @MaxLength(200) title!: string;
  @IsOptional() @IsString() parentId?: string;
  @IsOptional() @IsString() @MaxLength(255) mimeType?: string;
  @IsOptional() @IsString() content?: string;
}

export class UpdateDocumentDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(200) title?: string;
  @IsOptional() @IsString() content?: string;
}

export class SetDocumentPermissionDto {
  @IsString() @IsNotEmpty() @IsIn(["member"]) subjectKind!: "member";
  @IsString() @IsNotEmpty() subjectId!: string;
  @IsIn(["read", "write", "admin"]) access!: "read" | "write" | "admin";
}