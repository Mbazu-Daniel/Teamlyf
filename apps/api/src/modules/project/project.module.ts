import { Module } from "@nestjs/common";
import { ProjectSharedModule } from "./project-shared.module";
import { ProjectController } from "./project.controller";
import { ProjectService } from "./project.service";
import { GithubAppModule } from "./github-app.module";

@Module({
  imports: [ProjectSharedModule, GithubAppModule],
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ProjectModule {}
