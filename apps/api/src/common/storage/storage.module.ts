import { Module } from "@nestjs/common";
import { API_ENV } from "../config/env.module";
import { PresignedUploadService } from "./presigned-upload.service";
import { R2StorageService } from "./r2-storage.service";
import { STORAGE_SERVICE } from "./storage.types";

@Module({
  providers: [
    { provide: STORAGE_SERVICE, inject: [API_ENV], useFactory: (env) => new R2StorageService(env) },
    PresignedUploadService,
  ],
  exports: [STORAGE_SERVICE, PresignedUploadService],
})
export class StorageModule {}
