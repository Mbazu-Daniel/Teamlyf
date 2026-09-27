import { Module } from "@nestjs/common";
import { EnvModule } from "../../common/config/env.module";
import { DbModule } from "../../common/db/db.module";
import { StorageModule } from "../../common/storage/storage.module";
import { MessageAttachmentsController } from "./attachments/attachments.controller";
import { MessageAttachmentsService } from "./attachments/message-attachments.service";
import { ChannelMembersService } from "./channels/channel-members.service";
import { ChannelMessagesService } from "./channels/channel-messages.service";
import { ChannelsController } from "./channels/channels.controller";
import { ChannelsService } from "./channels/channels.service";
import { ChatMembersController } from "./chat-members/chat-members.controller";
import { ChatMembersService } from "./chat-members/chat-members.service";
import { DirectMessagesConversationsService } from "./direct-messages/direct-messages-conversations.service";
import { DirectMessagesHistoryService } from "./direct-messages/direct-messages-history.service";
import { DirectMessagesController } from "./direct-messages/direct-messages.controller";
import { DirectMessagesService } from "./direct-messages/direct-messages.service";
import { DirectMessagesThreadsService } from "./direct-messages/direct-messages-threads.service";
import { MessageMentionsController } from "./mentions/message-mentions.controller";
import { MessageMentionsService } from "./mentions/message-mentions.service";
import { MessageReactionsController } from "./reactions/message-reactions.controller";
import { MessageReactionsService } from "./reactions/message-reactions.service";
import { RealtimeModule } from "./realtime/realtime.module";
import { ThreadsController } from "./threads/threads.controller";
import { ThreadsService } from "./threads/threads.service";

/**
 * HTTP surface of chat: members, channels, direct messages, threads,
 * reactions, mentions and attachments. The socket side lives in
 * `RealtimeModule`, which is imported here rather than re-provided — it owns
 * the single `ChatPresenceService` instance, so both halves read the same
 * online/offline state.
 */
@Module({
  imports: [DbModule, EnvModule, StorageModule, RealtimeModule],
  controllers: [
    ChatMembersController,
    ChannelsController,
    DirectMessagesController,
    ThreadsController,
    MessageReactionsController,
    MessageMentionsController,
    MessageAttachmentsController,
  ],
  providers: [
    ChatMembersService,
    ChannelsService,
    ChannelMembersService,
    ChannelMessagesService,
    DirectMessagesService,
    DirectMessagesConversationsService,
    DirectMessagesHistoryService,
    DirectMessagesThreadsService,
    ThreadsService,
    MessageReactionsService,
    MessageMentionsService,
    MessageAttachmentsService,
  ],
})
export class ChatModule {}
