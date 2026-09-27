import { IsOptional, IsString } from "class-validator";

/** Body of `POST /organization/:orgId/calls/token` — parity with the pre-refactor endpoint. */
export class CreateCallTokenDto {
  @IsString()
  roomName!: string;

  @IsOptional()
  @IsString()
  participantName?: string;
}
