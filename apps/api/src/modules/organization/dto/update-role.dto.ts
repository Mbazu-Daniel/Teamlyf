import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsObject, IsOptional, IsString } from "class-validator";

export class UpdateRoleDto {
  @ApiPropertyOptional({
    description: "Replaces the role's permission map",
    example: { pm: ["read", "update", "delete"] },
    type: "object",
    additionalProperties: { type: "array", items: { type: "string" } },
  })
  @IsOptional()
  @IsObject()
  permission?: Record<string, string[]>;

  @ApiPropertyOptional({ description: "Renames the role", example: "senior-translator" })
  @IsOptional()
  @IsString()
  roleName?: string;
}
