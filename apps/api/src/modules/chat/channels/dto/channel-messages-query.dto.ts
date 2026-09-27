import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

/**
 * `?page=&limit=&before=` — the infinite query sends `page=1` on the first load
 * and then swaps it for `before`, the ISO `createdAt` of the oldest message it
 * already holds.
 */
export class ChannelMessagesQueryDto {
  @ApiPropertyOptional({ example: 1, minimum: 1, description: "Ignored once `before` is set" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: "ISO timestamp — return messages created before it" })
  @IsOptional()
  @IsString()
  before?: string;
}
