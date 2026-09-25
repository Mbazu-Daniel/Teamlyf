import { ApiProperty } from "@nestjs/swagger";
import { ArrayNotEmpty, IsArray, IsString } from "class-validator";

export class ReorderDto {
  @ApiProperty({
    description: "Ids in their new order; the first id is ranked first",
    example: ["3f1d2b4a-1c2d-4e5f-8a9b-0c1d2e3f4a5b", "7b8c9d0e-1f2a-4b3c-9d8e-7f6a5b4c3d2e"],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids!: string[];
}
