import { IsOptional, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class GetActiveMemberRoleQueryDto {
  @ApiPropertyOptional({ example: "user-id" })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ example: "organization-slug" })
  @IsOptional()
  @IsString()
  organizationSlug?: string;
}
