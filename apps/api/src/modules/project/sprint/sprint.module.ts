import { Module } from "@nestjs/common";
import { ProjectSharedModule } from "../project-shared.module";
import { SprintController } from "./sprint.controller";
import { SprintService } from "./sprint.service";

@Module({
  imports: [ProjectSharedModule],
  controllers: [SprintController],
  providers: [SprintService],
  exports: [SprintService],
})
export class SprintModule {}
