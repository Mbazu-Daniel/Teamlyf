import { Module } from "@nestjs/common";
import { StorageModule } from "../../../common/storage/storage.module";
import { ProjectSharedModule } from "../project-shared.module";
import { AttachmentController } from "./attachment.controller";
import { AttachmentService } from "./attachment.service";

@Module({
  imports: [ProjectSharedModule, StorageModule],
  controllers: [AttachmentController],
  providers: [AttachmentService],
})
export class AttachmentModule {}
