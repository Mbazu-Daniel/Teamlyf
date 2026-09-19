import { Module } from "@nestjs/common";
import { ProjectSharedModule } from "../project-shared.module";
import { MilestoneController } from "./milestone.controller";
import { MilestoneService } from "./milestone.service";

@Module({
  imports: [ProjectSharedModule],
  controllers: [MilestoneController],
  providers: [MilestoneService],
})
export class MilestoneModule {}
