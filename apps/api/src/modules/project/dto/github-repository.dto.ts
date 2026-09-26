import { IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class ConnectGithubRepositoryDto {
  @IsString()
  @IsNotEmpty()
  repositoryId!: string;

  @IsString()
  @MinLength(1)
  repositoryFullName!: string;

  @IsString()
  @MinLength(1)
  defaultBranch!: string;

  @IsOptional()
  @IsString()
  baseBranch?: string;

  @IsOptional()
  @IsString()
  installationId?: string;
}
