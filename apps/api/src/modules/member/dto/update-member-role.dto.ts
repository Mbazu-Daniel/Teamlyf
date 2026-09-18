import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { OrganizationRolesField } from "./organization-roles-field.decorator";
import type { OrganizationRole } from "../types";

export class UpdateMemberRoleDto {
  @OrganizationRolesField(["admin"])
  role!: OrganizationRole[];

  @ApiProperty({ example: "member-id" })
  @IsString()
  @IsNotEmpty()
  memberId!: string;
}
