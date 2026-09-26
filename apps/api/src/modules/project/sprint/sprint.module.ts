import { Module } from "@nestjs/common";
import { ProjectModule } from "../project.module";
import { SprintController } from "./sprint.controller";
import { SprintService } from "./sprint.service";

@Module({
  imports: [ProjectModule],
  controllers: [SprintController],
  providers: [SprintService],
  exports: [SprintService],
})
export class SprintModule {}
