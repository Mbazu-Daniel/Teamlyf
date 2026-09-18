import { IsEmail, IsNotEmpty, IsBoolean, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { OrganizationRolesField } from "./organization-roles-field.decorator";
import type { OrganizationRole } from "../../member/types";

export class InviteMemberDto {
  @ApiProperty({ example: "example@gmail.com" })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @OrganizationRolesField(["member"])
  role!: OrganizationRole[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  resend?: boolean;
}
