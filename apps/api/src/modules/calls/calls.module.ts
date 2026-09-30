import { Module } from "@nestjs/common";
import { DbModule } from "../../common/db/db.module";
import { StorageModule } from "../../common/storage/storage.module";
import { CallRecordingService } from "./call-recording.service";
import { CallsController } from "./calls.controller";
import { CallsService } from "./calls.service";
import { CallsWebhookController } from "./calls-webhook.controller";
import { VideoMinutesService } from "./video-minutes.service";

@Module({
  imports: [DbModule, StorageModule],
  controllers: [CallsController, CallsWebhookController],
  providers: [CallsService, VideoMinutesService, CallRecordingService],
  exports: [CallsService],
})
export class CallsModule {}
