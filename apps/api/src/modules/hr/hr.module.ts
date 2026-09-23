import { Module } from "@nestjs/common";
import { DbModule } from "../../common/db/db.module";
import { HrController } from "./hr.controller";
import { HrService } from "./hr.service";

@Module({ imports: [DbModule], controllers: [HrController], providers: [HrService] })
export class HrModule {}
