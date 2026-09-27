import { Module } from "@nestjs/common";
import { LocalStorageService } from "./local-storage.service";
import { StorageController } from "./storage.controller";
import { STORAGE_SERVICE } from "./storage.types";

@Module({
  controllers: [StorageController],
  providers: [{ provide: STORAGE_SERVICE, useClass: LocalStorageService }],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}
