import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
export class CreateTaskAttachmentDto {
  @IsString() @IsNotEmpty() @MaxLength(255) name!: string;
  @IsString() @IsNotEmpty() url!: string;
  @IsOptional() @IsString() mimeType?: string;
  @IsOptional() @IsString() size?: string;
}
