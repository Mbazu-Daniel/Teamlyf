import { IsMimeType, IsNotEmpty, IsNumber, IsString, MaxLength, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class InitiateAttachmentUploadDto {
  @ApiProperty({ example: "design-spec.pdf" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName!: string;

  @ApiProperty({ example: "application/pdf" })
  @IsMimeType()
  mimeType!: string;

  @ApiProperty({ example: 1024000, description: "File size in bytes" })
  @IsNumber()
  @Min(1)
  fileSize!: number;
}

export class CreateAttachmentDto {
  @ApiProperty({ description: "The fileKey returned by the upload-url endpoint" })
  @IsString()
  @IsNotEmpty()
  fileKey!: string;

  @ApiProperty({ example: "design-spec.pdf" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  originalFileName!: string;

  @ApiProperty({ example: "application/pdf" })
  @IsMimeType()
  mimeType!: string;

  @ApiProperty({ example: 1024000 })
  @IsNumber()
  @Min(1)
  fileSize!: number;
}
