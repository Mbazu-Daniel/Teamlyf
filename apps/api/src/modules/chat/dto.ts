import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class CreateChannelDto {
  @IsString() @IsNotEmpty() @MaxLength(100) name!: string;
  @IsOptional() @IsString() kind?: "channel" | "direct";
  @IsOptional() @IsBoolean() isPrivate?: boolean;
  @IsOptional() @IsArray() @IsUUID("4", { each: true }) memberIds?: string[];
}

export class CreateMessageDto {
  @IsString() @IsNotEmpty() @MaxLength(10_000) content!: string;
  @IsOptional() @IsUUID() threadRootId?: string;
}

export class ReactionDto { @IsString() @IsNotEmpty() @MaxLength(32) emoji!: string; }
