import { IsDateString, IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import { PartialType } from "@nestjs/swagger";

export class CreateSprintDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsIn(["planned", "active", "completed", "cancelled"])
  status?: string;
}

export class UpdateSprintDto extends PartialType(CreateSprintDto) {}
