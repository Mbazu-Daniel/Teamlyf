import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString } from "class-validator";

export class ForgotPasswordDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ description: "URL to redirect the user to after reset" })
  @IsOptional()
  @IsString()
  redirectTo?: string;
}
