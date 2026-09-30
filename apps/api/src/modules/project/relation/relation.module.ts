import { Module } from "@nestjs/common";
import { ProjectSharedModule } from "../project-shared.module";
import { TaskRelationController } from "./task-relation.controller";
import { TaskRelationService } from "./task-relation.service";
import { TaskSubscriberController } from "./task-subscriber.controller";
import { TaskSubscriberService } from "./task-subscriber.service";

@Module({
  imports: [ProjectSharedModule],
  controllers: [TaskRelationController, TaskSubscriberController],
  providers: [TaskRelationService, TaskSubscriberService],
})
export class RelationModule {}
