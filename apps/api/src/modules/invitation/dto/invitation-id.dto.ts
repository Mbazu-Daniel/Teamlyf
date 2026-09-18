import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class InvitationIdDto {
  @ApiProperty({ example: "invitation-id" })
  @IsString()
  @IsNotEmpty()
  invitationId!: string;
}
