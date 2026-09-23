import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class CreateCallTokenDto {
  @ApiProperty({ maxLength: 120 })
  @IsString()
  @MaxLength(120)
  roomName!: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  participantName?: string;
}
