import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

const PROJECT_CODE_MIN = 2;
const PROJECT_CODE_MAX = 5;

export class CreateProjectDto {
  @IsOptional()
  @IsIn(["planned", "backlog", "in_progress", "paused", "completed", "cancelled"])
  status?: string;
  @IsOptional() @IsArray() @ArrayUnique() @IsUUID(undefined, { each: true }) leadIds?: string[];
  @ApiProperty({ example: "My Project" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: "PROJ", minLength: PROJECT_CODE_MIN, maxLength: PROJECT_CODE_MAX })
  @IsString()
  @MinLength(PROJECT_CODE_MIN)
  @MaxLength(PROJECT_CODE_MAX)
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
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]+$/)
  @MinLength(PROJECT_CODE_MIN)
  @MaxLength(PROJECT_CODE_MAX)
  identifier?: string;
  @IsOptional()
  @IsIn(["planned", "backlog", "in_progress", "paused", "completed", "cancelled"])
  status?: string;
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  image?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  coverImageURL?: string;
}
