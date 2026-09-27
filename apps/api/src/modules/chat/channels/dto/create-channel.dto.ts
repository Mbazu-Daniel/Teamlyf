import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

/** `POST /organization/:orgId/channels` — the sidebar's create-channel form. */
export class CreateChannelDto {
  @ApiProperty({ example: "general", maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: "General discussion channel" })
  @IsOptional()
  @IsString()
  description?: string;
}
