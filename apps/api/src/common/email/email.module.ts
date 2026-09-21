import { Global, Module } from "@nestjs/common";
import { EnvModule } from "../config/env.module";
import { EmailService } from "./email.service";
@Global() @Module({ imports: [EnvModule], providers: [EmailService], exports: [EmailService] }) export class EmailModule {}
