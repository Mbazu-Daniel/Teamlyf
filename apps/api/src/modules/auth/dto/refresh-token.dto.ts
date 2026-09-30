import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString } from "class-validator";

export class RefreshTokenDto {
  @ApiPropertyOptional({ description: "The Better Auth account ID" })
  @IsOptional()
  @IsString()
  accountId?: string;

  @ApiPropertyOptional({ description: "Select the current account from its signed cookie" })
  @IsOptional()
  @IsBoolean()
  useAccountCookie?: boolean;

  @ApiPropertyOptional({ description: "The user ID associated with the account" })
  @IsOptional()
  @IsString()
  userId?: string;
}
