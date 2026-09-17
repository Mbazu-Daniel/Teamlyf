import type { Database } from "@teamlyf/db";
import type { GoogleAuthCredentials } from "./google-auth-credentials.type";

export type CreateAuthOptions = {
  db: Database;
  secret: string;
  baseURL: string;
  webOrigin: string;
  google?: GoogleAuthCredentials;
};
