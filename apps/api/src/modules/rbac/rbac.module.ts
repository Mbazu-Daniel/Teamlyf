import { Global, Module } from "@nestjs/common";
import { DbModule } from "../../common/db/db.module";
import { AuthModule } from "../auth/auth.module";
import { OrgMemberGuard } from "./org-member.guard";
import { PermissionsGuard } from "./permissions.guard";

@Global()
@Module({
  imports: [DbModule, AuthModule],
  providers: [OrgMemberGuard, PermissionsGuard],
  exports: [OrgMemberGuard, PermissionsGuard],
})
export class RbacModule {}
