import { Module } from "@nestjs/common";
import { DbModule } from "../../common/db/db.module";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";

@Module({
  imports: [DbModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
