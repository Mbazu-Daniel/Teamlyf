import { Module } from "@nestjs/common";
import { DbModule } from "../../common/db/db.module";

@Module({ imports: [DbModule], exports: [DbModule] })
export class HrSharedModule {}
