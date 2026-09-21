import { Module } from "@nestjs/common";
import { DbModule } from "../../common/db/db.module";
import { EnvModule } from "../../common/config/env.module";
import { BillingModule } from "../billing/billing.module";
import { AgentController } from "./agent.controller";
import { AgentQueueService } from "./agent-queue.service";
import { AgentService } from "./agent.service";

@Module({ imports: [DbModule, EnvModule, BillingModule], controllers: [AgentController], providers: [AgentQueueService, AgentService], exports: [AgentQueueService, AgentService] })
export class AgentModule {}
