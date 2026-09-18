import { applyDecorators } from "@nestjs/common";
import { Transform } from "class-transformer";
import { IsArray, IsIn } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import {
  ORGANIZATION_ROLES,
  parseOrganizationRoles,
} from "../../member/types";

export function OrganizationRolesField(example: string[]) {
  return applyDecorators(
    ApiProperty({ example, type: [String], enum: [...ORGANIZATION_ROLES] }),
    Transform(({ value }) => parseOrganizationRoles(value)),
    IsArray(),
    IsIn([...ORGANIZATION_ROLES], { each: true }),
  );
}
