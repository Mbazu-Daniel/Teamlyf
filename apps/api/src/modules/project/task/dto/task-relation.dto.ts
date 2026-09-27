import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";
import { TASK_RELATION_TYPES, type TaskRelationType } from "@teamlyf/db/project-schema";

export class CreateTaskRelationDto {
  @ApiProperty({ description: "ID of the target task to relate to" })
  @IsString()
  @IsNotEmpty()
  targetTaskId!: string;

  @ApiProperty({
    enum: TASK_RELATION_TYPES,
    description: "Type of relation: BLOCKED_BY, RELATED_TO, DUPLICATE_OF",
  })
  @IsIn(TASK_RELATION_TYPES)
  relationType!: TaskRelationType;
}

export class CreateTaskSubscriberDto {
  @ApiProperty({ description: "Member ID to subscribe" })
  @IsString()
  @IsNotEmpty()
  memberId!: string;

  @ApiPropertyOptional({
    description: "Notification preferences for the subscriber",
    example: { notifyOnStatusChange: true, notifyOnComment: true },
  })
  @IsOptional()
  @IsObject()
  preferences?: Record<string, boolean>;
}
