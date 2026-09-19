import { SetMetadata } from "@nestjs/common";
import type {
  PermissionAction,
  PermissionResource,
} from "../../common/better-auth/permissions";

export const REQUIRE_PERMISSION_KEY = "require_permission";

export type RequirePermissionMeta = {
  resource: PermissionResource;
  action: string;
  /** Route param name for instance-level override via permission_grant.resourceId */
  resourceIdParam?: string;
};

export function RequirePermission(
  resource: PermissionResource,
  action: PermissionAction | string,
  resourceIdParam?: string,
): MethodDecorator & ClassDecorator {
  return SetMetadata(REQUIRE_PERMISSION_KEY, {
    resource,
    action,
    resourceIdParam,
  } satisfies RequirePermissionMeta);
}
