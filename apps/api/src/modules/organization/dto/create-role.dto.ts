import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsObject, IsString } from "class-validator";

export class CreateRoleDto {
  @ApiProperty({ example: "translator" })
  @IsString()
  @IsNotEmpty()
  role!: string;

  @ApiProperty({
    description: "Resource → actions, validated against the permission catalog",
    example: { pm: ["read", "update"], hr: ["read"] },
    type: "object",
    additionalProperties: { type: "array", items: { type: "string" } },
  })
  @IsObject()
  permission!: Record<string, string[]>;
}
