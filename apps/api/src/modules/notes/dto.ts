import { IsBase64, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
export class CreateNoteDto { @IsString() @MaxLength(255) title!: string; @IsOptional() @IsUUID() parentId?: string; @IsOptional() @IsUUID() linkedTaskId?: string; @IsOptional() @IsString() content?: string; }
export class UpdateNoteDto { @IsOptional() @IsString() @MaxLength(255) title?: string; @IsOptional() @IsUUID() parentId?: string; @IsOptional() @IsUUID() linkedTaskId?: string; @IsOptional() @IsString() content?: string; }
export class NoteUpdateDto { @IsBase64() update!: string; }
