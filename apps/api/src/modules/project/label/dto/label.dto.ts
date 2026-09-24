import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateLabelDto {
  @ApiProperty({ example: "bug" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: "#EF4444" })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: "A known bug" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parentId?: string;
}

export class UpdateLabelDto {
  @ApiPropertyOptional({ example: "bug" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: "#EF4444" })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: "A known bug" })
  @IsOptional()
  @IsString()
  description?: string;
}
