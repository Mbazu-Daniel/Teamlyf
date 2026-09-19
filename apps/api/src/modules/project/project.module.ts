import { Module } from "@nestjs/common";
import { ProjectSharedModule } from "./project-shared.module";
import { ProjectController } from "./project.controller";
import { ProjectService } from "./project.service";

@Module({
  imports: [ProjectSharedModule],
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ProjectModule {}
