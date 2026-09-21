import { Global, Module } from "@nestjs/common";
import { DbModule } from "../../common/db/db.module";
import { AuthModule } from "../auth/auth.module";
import { OrgMemberGuard } from "./org-member.guard";
import { OrganizationPermissionService } from "./organization-permission.service";
import { PermissionsGuard } from "./permissions.guard";

@Global()
@Module({
  imports: [DbModule, AuthModule],
  providers: [OrgMemberGuard, OrganizationPermissionService, PermissionsGuard],
  exports: [OrgMemberGuard, OrganizationPermissionService, PermissionsGuard],
})
export class RbacModule {}
