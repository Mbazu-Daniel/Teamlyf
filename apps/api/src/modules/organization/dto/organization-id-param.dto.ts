import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class OrganizationIdParamDto {
  @ApiProperty({ example: "organization-id" })
  @IsString()
  @IsNotEmpty()
  orgId!: string;
}
