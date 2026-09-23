import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as aiSchema from "./ai";
import * as agentSchema from "./agent";
import * as authSchema from "./auth";
import * as orgSchema from "./organization";
import * as projectSchema from "./project";
import * as documentsSchema from "./documents";
import * as notesSchema from "./notes";
import * as hrSchema from "./hr";
import * as billingSchema from "./billing";
import * as chatSchema from "./chat";

const allSchemas = {
  ...aiSchema,
  ...agentSchema,
  ...authSchema,
  ...orgSchema,
  ...projectSchema,
  ...documentsSchema,
  ...notesSchema,
  ...hrSchema,
  ...billingSchema,
  ...chatSchema,
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
export * from "./organization";
export * as projectSchema from "./project";
export * from "./project";
export * as documentsSchema from "./documents";
export * from "./documents";
export * as notesSchema from "./notes";
export * from "./notes";
export * as hrSchema from "./hr";
export * from "./hr";
export * as billingSchema from "./billing";
export * from "./billing";
export * as agentSchema from "./agent";
export * from "./agent";
export * as aiSchema from "./ai";
export * from "./ai";

export * as chatSchema from "./chat";
export * from "./chat";
