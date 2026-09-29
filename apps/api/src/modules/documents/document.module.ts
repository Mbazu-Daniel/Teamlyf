import { Module } from "@nestjs/common";
import { DbModule } from "../../common/db/db.module";
import { DocumentController } from "./document.controller";
import { DocumentService } from "./document.service";
import { StorageModule } from "../../common/storage/storage.module";

@Module({
  imports: [DbModule, StorageModule],
  controllers: [DocumentController],
  providers: [DocumentService],
})
export class DocumentModule {}
