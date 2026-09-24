import { ApiProperty, PartialType } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsString, Min } from "class-validator";

export class CreateLeavePolicyDto {
  @ApiProperty({ example: "Annual leave" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 20 })
  @IsInt()
  @Min(0)
  daysPerYear!: number;
}

export class UpdateLeavePolicyDto extends PartialType(CreateLeavePolicyDto) {}
