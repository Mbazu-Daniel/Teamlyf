import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class CreateNoteDto {
  @IsOptional() @IsBoolean() private?: boolean;
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ description: "Task this note is linked to" })
  @IsOptional()
  @IsUUID()
  taskId?: string;
}

export class UpdateNoteDto {
  @IsOptional() @IsBoolean() private?: boolean;
  @IsOptional() @IsBoolean() archived?: boolean;
  @IsOptional() @IsInt() @Min(1) revision?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @ApiPropertyOptional({ nullable: true, description: "Task this note is linked to" })
  @IsOptional()
  @IsUUID()
  taskId?: string | null;
}

export class NoteFavoriteDto { @IsBoolean() enabled!: boolean; }
export class RestoreNoteDto { @IsInt() @Min(1) revision!: number; }
