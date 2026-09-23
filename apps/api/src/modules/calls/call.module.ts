import { Module } from "@nestjs/common";
import { EnvModule } from "../../common/config/env.module";
import { CallController } from "./call.controller";
import { CallService } from "./call.service";

@Module({ imports: [EnvModule], controllers: [CallController], providers: [CallService] })
export class CallModule {}
