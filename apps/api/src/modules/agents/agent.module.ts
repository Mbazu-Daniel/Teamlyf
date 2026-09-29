import { Module } from "@nestjs/common";
import { DbModule } from "../../common/db/db.module";
import { AgentController } from "./agent.controller";
import { AgentService } from "./agent.service";
import { ProjectSharedModule } from "../project/project-shared.module";
import { TaskService } from "../project/task/task.service";

@Module({
  imports: [DbModule, ProjectSharedModule],
  controllers: [AgentController],
  providers: [AgentService, TaskService],
})
export class AgentModule {}
