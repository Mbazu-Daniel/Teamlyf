import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class ResetPasswordDto {
  @ApiProperty({ description: "The new password to set" })
  @IsString()
  @IsNotEmpty()
  newPassword!: string;

  @ApiPropertyOptional({ description: "Reset token from the password-reset email" })
  @IsOptional()
  @IsString()
  token?: string;
}
