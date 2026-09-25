import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";

const SUBJECT_KINDS = ["user", "agent"] as const;
type SubjectKind = (typeof SUBJECT_KINDS)[number];

export class CreatePermissionGrantDto {
  @ApiProperty({ enum: SUBJECT_KINDS, description: "user → better-auth userId; agent → agent.id" })
  @IsIn(SUBJECT_KINDS)
  subjectKind!: SubjectKind;

  @ApiProperty({ description: "userId when subjectKind=user, agent.id when subjectKind=agent" })
  @IsString()
  @IsNotEmpty()
  subjectId!: string;

  @ApiProperty({ example: "pm", description: "Permission resource from the catalog" })
  @IsString()
  @IsNotEmpty()
  module!: string;

  @ApiProperty({ example: "update", description: "Permission action from the catalog" })
  @IsString()
  @IsNotEmpty()
  action!: string;

  @ApiPropertyOptional({ description: "Optional instance scope (e.g. a project id)" })
  @IsOptional()
  @IsString()
  resourceId?: string;
}

export class GetPermissionGrantsQueryDto {
  @ApiPropertyOptional({ enum: SUBJECT_KINDS })
  @IsOptional()
  @IsIn(SUBJECT_KINDS)
  subjectKind?: SubjectKind;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectId?: string;
}
