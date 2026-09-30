import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";

export class CreateCallTokenDto {
  @IsString()
  roomName!: string;

  @IsOptional()
  @IsString()
  participantName?: string;
}

export class InitiateRecordingDto {
  @IsString()
  fileName!: string;

  @IsIn(["video/webm", "video/mp4", "audio/webm", "audio/mp4"])
  mimeType!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100 * 1024 * 1024 * 1024)
  fileSize?: number;
}

export class ConfirmRecordingDto {
  @IsString()
  fileKey!: string;
}
