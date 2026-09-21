import { IsArray, IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateAgentDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsNotEmpty() capabilityType!: string;
  @IsOptional() @IsArray() @IsString({ each: true }) toolGrants?: string[];
}

export class UpdateAgentDto {
  @IsOptional() @IsString() @IsNotEmpty() name?: string;
  @IsOptional() @IsString() @IsNotEmpty() capabilityType?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) toolGrants?: string[];
  @IsOptional() @IsString() status?: string;
}

export class AssignAgentTaskDto {
  @IsUUID() agentId!: string;
  @IsString() @IsNotEmpty() sourceType!: string;
  @IsUUID() sourceId!: string;
  @IsOptional() @IsObject() input?: Record<string, unknown>;
}

export class CredentialDto {
  @IsString() @IsNotEmpty() provider!: string;
  @IsString() @IsNotEmpty() value!: string;
}
export class ApprovalDto { @IsBoolean() approved!: boolean; }
