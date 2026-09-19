import { Module } from "@nestjs/common";
import { ProjectSharedModule } from "../project-shared.module";
import { StatusController } from "./status.controller";
import { StatusService } from "./status.service";

@Module({
  imports: [ProjectSharedModule],
  controllers: [StatusController],
  providers: [StatusService],
})
export class StatusModule {}
