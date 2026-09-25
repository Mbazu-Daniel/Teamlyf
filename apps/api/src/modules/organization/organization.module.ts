import { Module } from "@nestjs/common";
import { DbModule } from "../../common/db/db.module";
import { OrganizationController } from "./organization.controller";
import { OrganizationService } from "./organization.service";
import { RolesController } from "./roles.controller";
import { RolesService } from "./roles.service";

@Module({
  // DbModule: OrgMemberGuard injects the DATABASE token in this module's context.
  imports: [DbModule],
  controllers: [OrganizationController, RolesController],
  providers: [OrganizationService, RolesService],
})
export class OrganizationModule {}
