import { Module } from "@nestjs/common";
import { DbModule } from "../../common/db/db.module";
import { AgentController } from "./agent.controller";
import { AgentService } from "./agent.service";
import { AgentEventHub } from "./agent-event.hub";
import { AgentRuntimeController } from "./agent-runtime.controller";
import { AgentRuntimeService } from "./agent-runtime.service";
import { AgentSystemToolsService } from "./agent-system-tools.service";

@Module({
  imports: [DbModule],
  controllers: [AgentController, AgentRuntimeController],
  providers: [
    AgentService,
    AgentEventHub,
    AgentRuntimeService,
    AgentSystemToolsService,
  ],
})
export class AgentModule {}
