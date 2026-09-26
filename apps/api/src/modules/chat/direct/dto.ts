import { IsNotEmpty, IsOptional, IsString } from "class-validator";
export class CreateDirectMessageDto { @IsString() @IsNotEmpty() recipientId!: string; @IsString() @IsNotEmpty() content!: string; @IsOptional() @IsString() parentMessageId?: string; }
