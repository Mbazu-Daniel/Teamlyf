import { ArrayMinSize, IsArray, IsUUID } from "class-validator";

export class AddProjectMembersDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID("all", { each: true })
  memberIds!: string[];
}
