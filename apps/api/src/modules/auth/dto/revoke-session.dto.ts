import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/** Body for `POST /auth/sessions/revoke` — signs out one device by its token. */
export class RevokeSessionDto {
  @ApiProperty({ description: "Session token to revoke, as returned by GET /auth/sessions" })
  @IsString()
  @IsNotEmpty()
  token!: string;
}
