import { Module } from "@nestjs/common";
import { DbModule } from "../../common/db/db.module";
import { CallsController } from "./calls.controller";
import { CallsService } from "./calls.service";
import { CallsWebhookController } from "./calls-webhook.controller";
import { VideoMinutesService } from "./video-minutes.service";

@Module({
  imports: [DbModule],
  controllers: [CallsController, CallsWebhookController],
  providers: [CallsService, VideoMinutesService],
  exports: [CallsService],
})
export class CallsModule {}
