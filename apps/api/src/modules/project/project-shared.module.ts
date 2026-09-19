import { Module } from "@nestjs/common";
import { DbModule } from "../../common/db/db.module";
import { ProjectAccessService } from "./project-access.service";

@Module({
  imports: [DbModule],
  providers: [ProjectAccessService],
  exports: [ProjectAccessService, DbModule],
})
export class ProjectSharedModule {}
