import { Module } from "@nestjs/common";
import { ProjectSharedModule } from "../project-shared.module";
import { TaskController } from "./task.controller";
import { TaskService } from "./task.service";

@Module({
  imports: [ProjectSharedModule],
  controllers: [TaskController],
  providers: [TaskService],
})
export class TaskModule {}
