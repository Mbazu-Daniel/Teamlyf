import { IsArray, IsString, ArrayMinSize } from "class-validator";

export class AddProjectMembersDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  memberIds!: string[];
}
