import { IsOptional, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateOrganizationDto {
  @ApiPropertyOptional({ example: "Acme Inc" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: "https://example.com/logo.png" })
  @IsOptional()
  @IsString()
  logo?: string;
}
