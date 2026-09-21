import "dotenv/config";
import { createDb } from "@teamlyf/db";
import { account, user } from "@teamlyf/db/schema";
import { member, organization } from "@teamlyf/db/organization-schema";
import { project, status } from "@teamlyf/db/project-schema";
import { and, eq } from "drizzle-orm";
import { hashPassword } from "../common/helpers/hash-password";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const { db, client } = createDb(databaseUrl);

async function seed() {
  const email = "owner@teamlyf.local";
  let owner = await db.query.user.findFirst({ where: eq(user.email, email) });
  if (!owner) {
    [owner] = await db.insert(user).values({ name: "Teamlyf Owner", email, emailVerified: true }).returning();
    await db.insert(account).values({ userId: owner.id, accountId: owner.id, providerId: "credential", password: await hashPassword("ChangeMe123!") });
  }
  let org = await db.query.organization.findFirst({ where: eq(organization.slug, "teamlyf-dev") });
  if (!org) [org] = await db.insert(organization).values({ name: "Teamlyf Development", slug: "teamlyf-dev", plan: "scale" }).returning();
  let ownerMembership = await db.query.member.findFirst({ where: and(eq(member.organizationId, org.id), eq(member.userId, owner.id)) });
  if (!ownerMembership) [ownerMembership] = await db.insert(member).values({ organizationId: org.id, userId: owner.id, role: "owner" }).returning();
  let workspace = await db.query.project.findFirst({ where: and(eq(project.organizationId, org.id), eq(project.identifier, "DEMO")) });
  if (!workspace) {
    [workspace] = await db.insert(project).values({ organizationId: org.id, name: "Product Launch", identifier: "DEMO", description: "Seeded Teamlyf project" }).returning();
    await db.insert(status).values([{ projectId: workspace.id, name: "Backlog", group: "todo", sequence: 1, default: true }, { projectId: workspace.id, name: "In progress", group: "started", sequence: 2 }, { projectId: workspace.id, name: "Done", group: "done", sequence: 3 }]);
  }
  console.log(`Seeded ${org.slug}; sign in with ${email} / ChangeMe123!`);
}
seed().finally(() => client.end());
