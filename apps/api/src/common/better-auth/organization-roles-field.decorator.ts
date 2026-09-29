import { applyDecorators } from "@nestjs/common";
import { Transform } from "class-transformer";
import { ArrayMinSize, ArrayMaxSize, IsArray, Matches } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import {
  parseOrganizationRoles,
} from "../../modules/member/types";

export function OrganizationRolesField(example: string[]) {
  return applyDecorators(
    ApiProperty({ example, type: [String], description: "Built-in or organization-defined role names. Existence and assignment permissions are checked by Better Auth." }),
    Transform(({ value }) => parseOrganizationRoles(value)),
    IsArray(),
    ArrayMinSize(1),
    ArrayMaxSize(10),
    Matches(/^[a-zA-Z0-9_-]{1,100}$/, { each: true }),
  );
}
