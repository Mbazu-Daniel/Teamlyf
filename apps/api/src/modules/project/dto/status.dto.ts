import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateStatusDto {
  @ApiProperty({ example: "In Review" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: "#F59E0B" })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: "in_progress" })
  @IsOptional()
  @IsString()
  group?: string;
}

export class UpdateStatusDto {
  @ApiPropertyOptional({ example: "In Review" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: "#F59E0B" })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  default?: boolean;
}
