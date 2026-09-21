import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as authSchema from "./auth";
import * as orgSchema from "./organization";
import * as projectSchema from "./project";
import * as documentsSchema from "./documents";
import * as notesSchema from "./notes";
import * as hrSchema from "./hr";

const allSchemas = { ...authSchema, ...orgSchema, ...projectSchema, ...documentsSchema, ...notesSchema, ...hrSchema };

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
export * as documentsSchema from "./documents";
export * as notesSchema from "./notes";
export * from "./notes";
export * as hrSchema from "./hr";
export * from "./hr";
