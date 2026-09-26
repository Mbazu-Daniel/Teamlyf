import { MiddlewareConsumer, Module, RequestMethod } from "@nestjs/common";
import { DbModule } from "../../common/db/db.module";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { ChatUuidMiddleware } from "./chat-uuid.middleware";
import { DirectMessageController } from "./direct/direct-message.controller";
import { DirectMessageService } from "./direct/direct-message.service";

@Module({
  imports: [DbModule],
  controllers: [ChatController, DirectMessageController],
  providers: [ChatService, DirectMessageService],
  exports: [ChatService, DirectMessageService],
})
export class ChatModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ChatUuidMiddleware).forRoutes({ path: "organization/:orgId/channels", method: RequestMethod.ALL }, ChatController);
  }
}
