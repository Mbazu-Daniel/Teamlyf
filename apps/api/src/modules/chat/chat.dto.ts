import { ArrayNotEmpty, IsArray, IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from "class-validator";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class CreateChannelDto {
  @IsString() @IsNotEmpty() @MaxLength(100) name!: string;
  @IsOptional() @IsIn(["channel", "direct"]) kind?: "channel" | "direct";
  @IsOptional() @IsBoolean() isPrivate?: boolean;
  @IsOptional() @IsArray() @Matches(uuidPattern, { each: true }) memberIds?: string[];
}

export class AddMembersDto {
  @IsArray() @ArrayNotEmpty() @Matches(uuidPattern, { each: true }) memberIds!: string[];
}

export class CreateMessageDto {
  @IsString() @IsNotEmpty() @MaxLength(10_000) content!: string;
  @IsOptional() @Matches(uuidPattern) threadRootId?: string;
}

export class UpdateMessageDto {
  @IsString() @IsNotEmpty() @MaxLength(10_000) content!: string;
}

export class ReactionDto {
  @IsString() @IsNotEmpty() @MaxLength(32) emoji!: string;
}
