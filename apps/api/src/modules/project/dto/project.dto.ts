import { ArrayUnique, IsArray, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, Matches } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateProjectDto {
  @IsOptional() @IsIn(["planned", "backlog", "in_progress", "paused", "completed", "cancelled"]) status?: string;
  @IsOptional() @IsArray() @ArrayUnique() @IsUUID(undefined, { each: true }) leadIds?: string[];
  @ApiProperty({ example: "My Project" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: "PROJ" })
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @ApiPropertyOptional({ example: "Project description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "🚀" })
  @IsOptional()
  @IsString()
  emoji?: string;
}

export class UpdateProjectDto {
  @IsOptional() @IsString() @Matches(/^[a-zA-Z0-9_-]+$/) identifier?: string;
  @IsOptional() @IsIn(["planned", "backlog", "in_progress", "paused", "completed", "cancelled"]) status?: string;
  @IsOptional() @IsArray() @ArrayUnique() @IsUUID(undefined, { each: true }) leadIds?: string[];
  @ApiPropertyOptional({ example: "My Project" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: "Project description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "🚀" })
  @IsOptional()
  @IsString()
  emoji?: string;
}
