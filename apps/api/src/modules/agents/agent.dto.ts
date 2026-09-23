import { IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID, Min, MinLength } from "class-validator";

export class CreateAgentDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateAgentDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class CreateAgentRunDto {
  @IsOptional()
  input?: unknown;
}

export class UpsertProviderConfigDto {
  @IsString()
  @MinLength(1)
  provider!: string;

  @IsString()
  @MinLength(1)
  model!: string;

  @IsIn(["teamlyf", "byok"])
  source!: "teamlyf" | "byok";

  @IsOptional()
  @IsString()
  @MinLength(1)
  apiKey?: string;
}

export class RecordUsageDto {
  @IsUUID()
  agentId!: string;

  @IsString()
  @MinLength(1)
  provider!: string;

  @IsString()
  @MinLength(1)
  model!: string;

  @IsIn(["teamlyf", "byok"])
  source!: "teamlyf" | "byok";

  @IsInt()
  @Min(0)
  inputTokens!: number;

  @IsInt()
  @Min(0)
  outputTokens!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedCostUsd?: number;
}