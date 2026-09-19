import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateProjectDto {
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
