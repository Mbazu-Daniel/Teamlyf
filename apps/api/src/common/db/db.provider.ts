import { type Provider } from "@nestjs/common";
import { createDb, type Database } from "@teamlyf/db";
import { type ApiEnv } from "../config/env";
import { API_ENV } from "../config/env.module";

export const DB_HANDLE = Symbol("DB_HANDLE");
export const DATABASE = Symbol("DATABASE");

export type DbHandle = ReturnType<typeof createDb>;

export const dbHandleProvider: Provider = {
  provide: DB_HANDLE,
  inject: [API_ENV],
  useFactory: (env: ApiEnv): DbHandle => createDb(env.DATABASE_URL),
};

export const dbProvider: Provider = {
  provide: DATABASE,
  inject: [DB_HANDLE],
  useFactory: (handle: DbHandle): Database => handle.db,
};
