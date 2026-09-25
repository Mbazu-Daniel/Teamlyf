import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength } from "class-validator";

export class UpdateEmergencyContactDto {
  @ApiProperty({ description: "Full name of the emergency contact", example: "Jane Doe" })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ description: "Phone number of the emergency contact", example: "+1-555-0123" })
  @IsString()
  @MaxLength(50)
  phone!: string;
}
