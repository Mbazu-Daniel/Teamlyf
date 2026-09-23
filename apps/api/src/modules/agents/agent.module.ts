import { Module } from "@nestjs/common";
import { DbModule } from "../../common/db/db.module";
import { AgentController } from "./agent.controller";
import { AgentService } from "./agent.service";

@Module({
  imports: [DbModule],
  controllers: [AgentController],
  providers: [AgentService],
})
export class AgentModule {}