import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class ChangePasswordDto {
  @ApiProperty({ description: "The current password of the user" })
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @ApiProperty({ description: "The new password to set" })
  @IsString()
  @IsNotEmpty()
  newPassword!: string;

  @ApiPropertyOptional({ description: "Revoke all other sessions after the change" })
  @IsOptional()
  @IsBoolean()
  revokeOtherSessions?: boolean;
}
