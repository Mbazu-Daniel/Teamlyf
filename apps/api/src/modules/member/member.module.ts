import { Module } from "@nestjs/common";
import { DbModule } from "../../common/db/db.module";
import { MemberController } from "./member.controller";
import { MemberService } from "./member.service";

@Module({
  imports: [DbModule],
  controllers: [MemberController],
  providers: [MemberService],
})
export class MemberModule {}
