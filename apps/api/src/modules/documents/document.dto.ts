import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Max,
} from "class-validator";

export class CreateDocumentDto {
  @IsString() @IsNotEmpty() @MaxLength(200) title!: string;
  @IsOptional() @IsString() parentId?: string;
  @IsOptional() @IsString() @MaxLength(255) mimeType?: string;
  @IsOptional() @IsString() content?: string;
}

export class UpdateDocumentDto {
  @IsOptional() @IsString() parentId?: string | null;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(200) title?: string;
  @IsOptional() @IsString() content?: string;
}

export class UploadDocumentDto {
  @IsString() @IsNotEmpty() @MaxLength(200) title!: string;
  @IsString() @IsNotEmpty() @MaxLength(255) mimeType!: string;
  @IsInt() @Min(1) @Max(104857600) fileSize!: number;
  @IsOptional() @IsString() parentId?: string;
}

export class SetDocumentPermissionDto {
  @IsString() @IsNotEmpty() @IsIn(["member"]) subjectKind!: "member";
  @IsString() @IsNotEmpty() subjectId!: string;
  @IsIn(["read", "write", "admin"]) access!: "read" | "write" | "admin";
}

export class ReplaceDocumentFileDto {
  @IsString() @IsNotEmpty() uploadedDocumentId!: string;
}
