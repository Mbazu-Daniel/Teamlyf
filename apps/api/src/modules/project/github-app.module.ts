import { Module } from "@nestjs/common";
import { EnvModule } from "../../common/config/env.module";
import { GithubAppService } from "./github-app.service";

@Module({
  imports: [EnvModule],
  providers: [GithubAppService],
  exports: [GithubAppService],
})
export class GithubAppModule {}
