import { IsDateString, IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";

const MILESTONE_STATUSES = ["backlog", "planned", "in-progress", "paused", "completed", "cancelled"] as const;

export class CreateMilestoneDto {
  @ApiProperty({ example: "v1.0 Release" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: "First major release" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: MILESTONE_STATUSES })
  @IsOptional()
  @IsIn(MILESTONE_STATUSES)
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  targetDate?: string;
}

export class UpdateMilestoneDto extends PartialType(CreateMilestoneDto) {}
