import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as aiSchema from "./ai";
import * as agentSchema from "./agent";
import * as authSchema from "./auth";
import * as orgSchema from "./organization";
import * as projectSchema from "./project";

const allSchemas = {
  ...aiSchema,
  ...agentSchema,
  ...authSchema,
  ...orgSchema,
  ...projectSchema,
};

export type Database = PostgresJsDatabase<typeof allSchemas>;

export function createDb(connectionString: string): { db: Database; client: postgres.Sql } {
  const client = postgres(connectionString);
  return { db: drizzle(client, { schema: allSchemas }), client };
}

export { generateId } from "./id";
export * from "./env";
export * as schema from "./auth";
export * as organizationSchema from "./organization";
export * as projectSchema from "./project";
export * as agentSchema from "./agent";
export * as aiSchema from "./ai";
