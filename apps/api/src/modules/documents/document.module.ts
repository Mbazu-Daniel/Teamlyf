import { Module } from "@nestjs/common";
import { DbModule } from "../../common/db/db.module";
import { DocumentController } from "./document.controller";
import { DocumentService } from "./document.service";

@Module({
  imports: [DbModule],
  controllers: [DocumentController],
  providers: [DocumentService],
})
export class DocumentModule {}