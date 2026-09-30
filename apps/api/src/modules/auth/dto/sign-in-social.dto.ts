import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SignInSocialDto {
  @ApiProperty({ example: "google", description: "OAuth provider id, e.g. google" })
  @IsString()
  @IsNotEmpty()
  provider!: string;

  @ApiPropertyOptional({ example: "http://localhost:3100/projects" })
  @IsOptional()
  @IsString()
  callbackURL?: string;

  @ApiPropertyOptional({ example: "http://localhost:3100/workspaces" })
  @IsOptional()
  @IsString()
  newUserCallbackURL?: string;

  @ApiPropertyOptional({ example: "http://localhost:3100/sign-in" })
  @IsOptional()
  @IsString()
  errorCallbackURL?: string;
}
