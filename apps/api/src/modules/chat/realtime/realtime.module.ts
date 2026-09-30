import { Module } from "@nestjs/common";
import { DbModule } from "../../../common/db/db.module";
import { StorageModule } from "../../../common/storage/storage.module";
import { CallsModule } from "../../calls/calls.module";
import { ChannelMessageWriterService } from "../channels/channel-message-writer.service";
import { DirectMessagesService } from "../direct-messages/direct-messages.service";
import { MessageReactionsService } from "../reactions/message-reactions.service";
import { ChatPresenceService } from "../shared/presence.service";
import { ChatRealtimeGateway } from "./chat-realtime.gateway";
import { ChatTypingService } from "./typing.service";

@Module({
  imports: [DbModule, StorageModule, CallsModule],
  providers: [
    ChatRealtimeGateway,
    ChatTypingService,
    ChatPresenceService,
    DirectMessagesService,
    ChannelMessageWriterService,
    MessageReactionsService,
  ],
  exports: [ChatPresenceService, ChatTypingService],
})
export class RealtimeModule {}
