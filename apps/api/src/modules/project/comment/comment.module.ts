import { Module } from "@nestjs/common";
import { ProjectSharedModule } from "../project-shared.module";
import { CommentController } from "./comment.controller";
import { CommentService } from "./comment.service";

@Module({
  imports: [ProjectSharedModule],
  controllers: [CommentController],
  providers: [CommentService],
})
export class CommentModule {}
