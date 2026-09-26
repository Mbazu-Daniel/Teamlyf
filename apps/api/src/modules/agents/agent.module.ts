import { Module } from "@nestjs/common";
import { DbModule } from "../../common/db/db.module";
import { AgentController } from "./agent.controller";
import { AgentService } from "./agent.service";
import { AgentEventHub } from "./agent-event.hub";
import { AgentRuntimeController } from "./agent-runtime.controller";
import { AgentRuntimeService } from "./agent-runtime.service";
import { AgentSystemToolsService } from "./agent-system-tools.service";
import { AgentGithubToolsService } from "./agent-github-tools.service";
import { GithubAppModule } from "../project/github-app.module";

@Module({
  imports: [DbModule, GithubAppModule],
  controllers: [AgentController, AgentRuntimeController],
  providers: [
    AgentService,
    AgentEventHub,
    AgentRuntimeService,
    AgentSystemToolsService,
    AgentGithubToolsService,
  ],
})
export class AgentModule {}
