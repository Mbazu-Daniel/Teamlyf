import { Inject, Injectable, type OnApplicationShutdown } from "@nestjs/common";
import { DB_HANDLE, type DbHandle } from "./db.provider";

@Injectable()
export class DbService implements OnApplicationShutdown {
  constructor(@Inject(DB_HANDLE) private readonly handle: DbHandle) {}

  async onApplicationShutdown(): Promise<void> {
    await this.handle.client.end({ timeout: 5 });
  }
}
