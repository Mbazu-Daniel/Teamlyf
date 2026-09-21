import { IsOptional, IsString, MaxLength } from "class-validator";
export class CreateCallTokenDto { @IsString() @MaxLength(120) roomName!: string; @IsOptional() @IsString() participantName?: string; }
