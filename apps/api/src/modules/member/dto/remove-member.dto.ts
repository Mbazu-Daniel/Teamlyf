import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RemoveMemberDto {
  @ApiProperty({ example: "user@example.com" })
  @IsString()
  @IsNotEmpty()
  memberIdOrEmail!: string;
}
