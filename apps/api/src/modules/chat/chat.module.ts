import { MiddlewareConsumer, Module, RequestMethod } from "@nestjs/common";
import { DbModule } from "../../common/db/db.module";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { ChatUuidMiddleware } from "./chat-uuid.middleware";

@Module({
  imports: [DbModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ChatUuidMiddleware)
      .forRoutes({ path: "organization/:orgId/channels", method: RequestMethod.ALL }, ChatController);
  }
}
