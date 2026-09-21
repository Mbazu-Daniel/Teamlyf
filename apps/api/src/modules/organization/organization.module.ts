import { Module } from "@nestjs/common";
import { DbModule } from "../../common/db/db.module";
import { OrganizationAccessService } from "./organization-access.service";
import { OrganizationController } from "./organization.controller";
import { OrganizationService } from "./organization.service";

@Module({
  imports: [DbModule],
  controllers: [OrganizationController],
  providers: [OrganizationService, OrganizationAccessService],
  exports: [OrganizationAccessService],
})
export class OrganizationModule {}
