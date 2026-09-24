import {
  IsArray,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ASSIGNEE_KINDS, type AssigneeKind } from "../types";

const PRIORITY_VALUES = ["urgent", "high", "medium", "low", "none"] as const;

export type Priority = (typeof PRIORITY_VALUES)[number];

export class TaskAssigneeInputDto {
  @ApiProperty({ enum: ASSIGNEE_KINDS })
  @IsIn(ASSIGNEE_KINDS)
  kind!: AssigneeKind;

  @ApiProperty({ description: "member.id when kind=member; agent.id when kind=agent (BYOK)" })
  @IsString()
  @IsNotEmpty()
  id!: string;
}

export class CreateTaskDto {
  @ApiProperty({ example: "Fix login bug" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  statusId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: PRIORITY_VALUES })
  @IsOptional()
  @IsIn(PRIORITY_VALUES)
  priority?: Priority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @ApiPropertyOptional({ type: [TaskAssigneeInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskAssigneeInputDto)
  assignees?: TaskAssigneeInputDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labelIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  milestoneIds?: string[];
}

export class UpdateTaskDto extends PartialType(CreateTaskDto) {}
