import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsUUID } from "class-validator";

/**
 * The ported UI posts `mentionedUserId`, but the value it collects from the
 * mention picker is the *member* id (`member.id`), which is exactly what the
 * `message_mention.mentioned_member_id` column wants — no translation needed.
 */
export class CreateMentionDto {
  @ApiProperty({
    description: "Message the mention was posted in",
    example: "0192f0c2-6b1a-7c3d-9e21-1f4a5b6c7d8e",
  })
  @IsUUID()
  messageId!: string;

  @ApiProperty({ enum: ["channel", "direct"], example: "channel" })
  @IsIn(["channel", "direct"])
  messageType!: "channel" | "direct";

  @ApiProperty({
    description: "Member id of the mentioned person",
    example: "0192f0c2-6b1a-7c3d-9e21-1f4a5b6c7d8f",
  })
  @IsUUID()
  mentionedUserId!: string;
}
