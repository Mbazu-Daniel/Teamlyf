import { Module } from "@nestjs/common";
import { DbModule } from "../../common/db/db.module";
import { EnvModule } from "../../common/config/env.module";
import { DocumentController } from "./document.controller";
import { DocumentService } from "./document.service";
import { DocumentStorageService } from "./document-storage.service";
@Module({ imports: [DbModule, EnvModule], controllers: [DocumentController], providers: [DocumentService, DocumentStorageService] }) export class DocumentModule {}
