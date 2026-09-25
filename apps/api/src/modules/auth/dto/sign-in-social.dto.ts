import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * Body for `POST /auth/sign-in/social`.
 *
 * `provider` is validated by better-auth, not here: a provider without
 * credentials is not a client error, it is a server that has that provider
 * switched off (404). Rejecting unknown names in the DTO would turn a
 * configuration gap into a 400 and hide it.
 */
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
