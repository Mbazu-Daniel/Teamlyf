import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class InitiateUploadDto {
  @ApiProperty({ description: "Original file name", example: "quarterly-report.pdf" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName!: string;

  @ApiProperty({
    description: "MIME type reported by the browser (may be empty for unknown types)",
    example: "application/pdf",
  })
  @IsString()
  @MaxLength(255)
  mimeType!: string;

  @ApiProperty({ description: "File size in bytes", example: 1024000, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  fileSize!: number;

  @ApiPropertyOptional({ description: "Channel the attachment will be sent to" })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  channelId?: string;

  @ApiPropertyOptional({ description: "DM peer the attachment will be sent to" })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  conversationId?: string;
}
