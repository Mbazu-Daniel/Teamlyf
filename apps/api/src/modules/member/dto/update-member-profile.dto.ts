import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateMemberProfileDto {
  @ApiPropertyOptional({ example: "Ada" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: "Lovelace" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName?: string;

  /**
   * Workspace-scoped profile photo as a data URL. Stored on the membership,
   * never on the global `user` record. Send `null` to clear it.
   */
  @ApiPropertyOptional({ example: "data:image/webp;base64,UklGRi...", nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200_000)
  avatar?: string | null;
}
