import { Module } from "@nestjs/common";
import { ProjectSharedModule } from "../project-shared.module";
import { AgentModule } from "../../agents/agent.module";
import { TaskController } from "./task.controller";
import { TaskService } from "./task.service";

@Module({
  imports: [ProjectSharedModule, AgentModule],
  controllers: [TaskController],
  providers: [TaskService],
})
export class TaskModule {}
