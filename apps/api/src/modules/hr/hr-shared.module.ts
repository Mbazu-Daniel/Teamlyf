import { Module } from "@nestjs/common";
import { DbModule } from "../../common/db/db.module";

/** Database seam shared by every HR submodule. */
@Module({ imports: [DbModule], exports: [DbModule] })
export class HrSharedModule {}
