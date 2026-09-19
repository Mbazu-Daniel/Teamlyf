import { Module } from "@nestjs/common";
import { DATABASE, DB_HANDLE, dbHandleProvider, dbProvider } from "./db.provider";
import { DbService } from "./db.service";

@Module({
  providers: [dbHandleProvider, dbProvider, DbService],
  exports: [DATABASE, DB_HANDLE, dbHandleProvider, dbProvider, DbService],
})
export class DbModule {}
