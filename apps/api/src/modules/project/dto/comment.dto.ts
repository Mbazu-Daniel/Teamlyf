import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional, PickType } from "@nestjs/swagger";

export class CreateCommentDto {
  @ApiProperty({ example: "This looks good!" })
  @IsString()
  @IsNotEmpty()
  body!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parentId?: string;
}

export class UpdateCommentDto extends PickType(CreateCommentDto, ["body"] as const) {}
