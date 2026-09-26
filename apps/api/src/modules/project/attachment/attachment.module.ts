import { Module } from "@nestjs/common";
import { ProjectSharedModule } from "../project-shared.module";
import { AttachmentController } from "./attachment.controller";
import { AttachmentService } from "./attachment.service";

@Module({ imports: [ProjectSharedModule], controllers: [AttachmentController], providers: [AttachmentService] })
export class AttachmentModule {}
