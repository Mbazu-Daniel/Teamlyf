import { Module } from "@nestjs/common";
import { DbModule } from "../../common/db/db.module";
import { AgentModule } from "../agents/agent.module";
import { AuthModule } from "../auth/auth.module";
import { ChatController } from "./chat.controller";
import { ChatGateway } from "./chat.gateway";
import { ChatService } from "./chat.service";

@Module({ imports: [DbModule, AgentModule, AuthModule], controllers: [ChatController], providers: [ChatService, ChatGateway] })
export class ChatModule {}
