import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsString } from "class-validator";

export class AddChannelMembersDto {
  @ApiProperty({
    description: "Workspace member ids to add to the channel",
    type: [String],
    example: ["0190f2c1-0000-7000-8000-000000000001"],
  })
  @IsArray()
  @IsString({ each: true })
  tenantMemberIds!: string[];
}
