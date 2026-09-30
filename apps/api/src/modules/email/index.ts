import { Module } from "@nestjs/common";
import { MailService } from "./mail.service";
import { SendByteService } from "./sendbyte.service";

@Module({
  providers: [SendByteService, MailService],
  exports: [MailService],
})
export class EmailModule {}
