import { Module } from "@nestjs/common";
import { ProjectModule } from "./project.module";
import { StatusModule } from "./status/status.module";
import { LabelModule } from "./label/label.module";
import { TaskModule } from "./task/task.module";
import { CommentModule } from "./comment/comment.module";
import { MilestoneModule } from "./milestone/milestone.module";
import { ProjectMemberModule } from "./member/project-member.module";
import { SprintModule } from "./sprint/sprint.module";
import { AttachmentModule } from "./attachment/attachment.module";

@Module({
  imports: [ProjectModule, StatusModule, LabelModule, TaskModule, CommentModule, MilestoneModule, ProjectMemberModule, SprintModule, AttachmentModule],
})
export class ProjectFeatureModule {}
