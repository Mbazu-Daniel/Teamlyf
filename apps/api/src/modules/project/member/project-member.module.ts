import { Module } from "@nestjs/common";
import { ProjectSharedModule } from "../project-shared.module";
import { ProjectMemberController } from "./project-member.controller";
import { ProjectMemberService } from "./project-member.service";

@Module({
  imports: [ProjectSharedModule],
  controllers: [ProjectMemberController],
  providers: [ProjectMemberService],
})
export class ProjectMemberModule {}
