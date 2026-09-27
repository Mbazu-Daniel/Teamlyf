import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

/**
 * `?page=&limit=&before=` — `getMessages` sends `page=1` on the first load and
 * switches to `before` (the `nextCursor` of the previous page) once it walks
 * further back, so the cursor wins whenever both are present.
 */
export class DirectMessagesQueryDto {
  @ApiPropertyOptional({ example: 1, minimum: 1 })
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

  @ApiPropertyOptional({
    description: "ISO timestamp of the oldest message already shown; the page returned is strictly older",
    example: "2026-09-26T09:15:00.000Z",
  })
  @IsOptional()
  @IsString()
  before?: string;
}
