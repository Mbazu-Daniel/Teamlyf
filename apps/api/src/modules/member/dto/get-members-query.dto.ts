import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Min } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

const FILTER_OPERATORS = [
  "eq",
  "ne",
  "lt",
  "lte",
  "gt",
  "gte",
  "in",
  "not_in",
  "contains",
  "starts_with",
  "ends_with",
] as const;

export class GetMembersQueryDto {
  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @ApiPropertyOptional({ example: "createdAt" })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ["asc", "desc"], default: "desc" })
  @IsOptional()
  @IsIn(["asc", "desc"])
  sortDirection?: "asc" | "desc";

  @ApiPropertyOptional({ example: "role" })
  @IsOptional()
  @IsString()
  filterField?: string;

  @ApiPropertyOptional({ enum: [...FILTER_OPERATORS], default: "eq" })
  @IsOptional()
  @IsIn([...FILTER_OPERATORS])
  filterOperator?: (typeof FILTER_OPERATORS)[number];

  @ApiPropertyOptional({ example: "owner", oneOf: [{ type: "string" }, { type: "array" }] })
  @IsOptional()
  @IsString({ each: true })
  filterValue?: string | string[];

  @ApiPropertyOptional({ example: "organization-slug" })
  @IsOptional()
  @IsString()
  organizationSlug?: string;
}
