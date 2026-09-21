import { Module } from "@nestjs/common";
import { EnvModule } from "../../common/config/env.module";
import { DbModule } from "../../common/db/db.module";
import { BillingModule } from "../billing/billing.module";
import { RbacModule } from "../rbac/rbac.module";
import { CallController } from "./call.controller";
import { CallService } from "./call.service";
@Module({ imports: [EnvModule, DbModule, BillingModule, RbacModule], controllers: [CallController], providers: [CallService] }) export class CallModule {}
