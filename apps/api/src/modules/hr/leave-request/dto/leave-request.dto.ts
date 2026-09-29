import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateLeaveRequestDto {
  @ApiProperty({ description: "Leave policy the request is booked against" })
  @IsString()
  @IsNotEmpty()
  policyId!: string;

  @ApiProperty()
  @IsDateString()
  startDate!: string;

  @ApiProperty()
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateLeaveRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reviewReason?: string;

  @ApiProperty({ enum: ["approved", "rejected"] })
  @IsIn(["approved", "rejected"])
  status!: "approved" | "rejected";
}
