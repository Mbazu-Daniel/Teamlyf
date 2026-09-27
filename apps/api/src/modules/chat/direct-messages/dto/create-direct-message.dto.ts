import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";

/** `POST /direct-messages` — `recipientId` is the partner's workspace member id. */
export class CreateDirectMessageDto {
  @ApiProperty({ description: "Recipient's workspace member id", example: "2f4ac1e0-2a6e-4d1f-9a1f-9f6d5f0f9b31" })
  @IsString()
  @IsNotEmpty()
  recipientId!: string;

  @ApiProperty({ description: "Message text — empty when the message is attachment-only" })
  @IsString()
  content!: string;

  @ApiPropertyOptional({
    description: "Attachment ids the composer already uploaded; they are linked to the new message",
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentIds?: string[];

  @ApiPropertyOptional({ description: "Root message id when the message is a thread reply" })
  @IsOptional()
  @IsString()
  parentMessageId?: string;
}
