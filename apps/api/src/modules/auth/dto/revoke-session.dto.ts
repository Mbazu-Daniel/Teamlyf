import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RevokeSessionDto {
  @ApiProperty({ description: "Session token to revoke, as returned by GET /auth/sessions" })
  @IsString()
  @IsNotEmpty()
  token!: string;
}
