import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDateString, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class ChannelSearchQueryDto {
  @ApiPropertyOptional({ description: "Substring of the message content" })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: "Only messages sent by this workspace member" })
  @IsOptional()
  @IsString()
  senderId?: string;

  @ApiPropertyOptional({ description: "ISO timestamp lower bound" })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: "ISO timestamp upper bound" })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
