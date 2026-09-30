import { Injectable } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { project, projectMember, status, task } from "@teamlyf/db/project-schema";
import { and, eq, sql } from "drizzle-orm";
import { DATABASE } from "../../common/db/db.provider";
import { ProjectAccessService } from "./project-access.service";
import type { CreateProjectDto, UpdateProjectDto } from "./dto";
import { requireOrganizationMemberOrNotFound } from "../../common/organization-member";

const DEFAULT_STATUSES = [
  { name: "Backlog", color: "#60646C", group: "backlog", sequence: 15000, default: true },
  { name: "Todo", color: "#60646C", group: "todo", sequence: 25000 },
  { name: "In Progress", color: "#F59E0B", group: "in_progress", sequence: 35000 },
  { name: "Done", color: "#46A758", group: "done", sequence: 45000 },
  { name: "Cancelled", color: "#9AA4BC", group: "cancelled", sequence: 55000 },
];

@Injectable()
export class ProjectService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly access: ProjectAccessService,
  ) {}

  async createProject(orgId: string, dto: CreateProjectDto, creatorMemberId: string) {
    for (const id of dto.leadIds ?? [])
      await requireOrganizationMemberOrNotFound(this.db, orgId, id);
    return this.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(project)
        .values({
          organizationId: orgId,
          name: dto.name,
          identifier: dto.identifier.toUpperCase(),
          description: dto.description ?? null,
          emoji: dto.emoji ?? null,
          status: dto.status ?? "planned",
        })
        .returning();

      await tx.insert(projectMember).values({
        projectId: created.id,
        organizationId: orgId,
        memberId: creatorMemberId,
        role: "admin",
      });
      for (const memberId of dto.leadIds ?? []) {
        if (memberId === creatorMemberId) continue;
        await tx
          .insert(projectMember)
          .values({ projectId: created.id, organizationId: orgId, memberId, role: "admin" });
      }

      await tx.insert(status).values(
        DEFAULT_STATUSES.map((item) => ({
          projectId: created.id,
          name: item.name,
          color: item.color,
          group: item.group,
          sequence: item.sequence,
          default: item.default ?? false,
        })),
      );

      return created;
    });
  }

  async getProjects(orgId: string) {
    const projects = await this.db.query.project.findMany({
      where: eq(project.organizationId, orgId),
      orderBy: (p, { desc }) => [desc(p.createdAt)],
    });

    if (projects.length === 0) return projects;

    const stats = await this.db
      .select({
        projectId: task.projectId,
        taskCount: sql<number>`count(*)`.mapWith(Number),
        completedCount: sql<number>`count(*) filter (where ${status.group} = 'done')`.mapWith(
          Number,
        ),
        targetDate: sql<string | null>`max(${task.targetDate})`,
      })
      .from(task)
      .innerJoin(project, eq(task.projectId, project.id))
      .innerJoin(status, eq(task.statusId, status.id))
      .where(eq(project.organizationId, orgId))
      .groupBy(task.projectId);
    const statsByProject = new Map(stats.map((stat) => [stat.projectId, stat]));

    const memberships = await this.db.query.projectMember.findMany({
      where: eq(projectMember.organizationId, orgId),
      with: { member: true },
    });
    const membersByProject = new Map<string, typeof memberships>();
    for (const membership of memberships) {
      const current = membersByProject.get(membership.projectId) ?? [];
      current.push(membership);
      membersByProject.set(membership.projectId, current);
    }

    return projects.map((item) => ({
      ...item,
      taskCount: statsByProject.get(item.id)?.taskCount ?? 0,
      completedCount: statsByProject.get(item.id)?.completedCount ?? 0,
      targetDate: statsByProject.get(item.id)?.targetDate ?? null,
      members: (membersByProject.get(item.id) ?? []).map((membership) => ({
        id: membership.member.id,
        firstName: membership.member.firstName,
        lastName: membership.member.lastName,
      })),
      leads: (membersByProject.get(item.id) ?? [])
        .filter((membership) => membership.role === "admin")
        .map((membership) => ({
          id: membership.member.id,
          firstName: membership.member.firstName,
          lastName: membership.member.lastName,
        })),
    }));
  }

  async getProject(orgId: string, projectId: string) {
    const found = await this.access.requireProject(orgId, projectId);
    const memberships = await this.db.query.projectMember.findMany({
      where: and(eq(projectMember.organizationId, orgId), eq(projectMember.projectId, projectId)),
      with: { member: true },
      orderBy: (row, { asc }) => [asc(row.createdAt)],
    });

    return {
      ...found,
      members: memberships.map((membership) => ({
        id: membership.member.id,
        firstName: membership.member.firstName,
        lastName: membership.member.lastName,
      })),
      leads: memberships
        .filter((membership) => membership.role === "admin")
        .map((membership) => ({
          id: membership.member.id,
          firstName: membership.member.firstName,
          lastName: membership.member.lastName,
        })),
    };
  }

  async updateProject(orgId: string, projectId: string, dto: UpdateProjectDto) {
    await this.access.requireProject(orgId, projectId);
    const { leadIds, coverImageURL, ...fields } = dto;
    for (const id of leadIds ?? []) await requireOrganizationMemberOrNotFound(this.db, orgId, id);
    return this.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(project)
        .set({
          ...fields,

          ...(coverImageURL === undefined ? {} : { coverImageUrl: coverImageURL || null }),
          identifier: fields.identifier?.toUpperCase(),
          updatedAt: new Date(),
        })
        .where(and(eq(project.organizationId, orgId), eq(project.id, projectId)))
        .returning();
      if (leadIds) {
        await tx
          .update(projectMember)
          .set({ role: "member" })
          .where(
            and(eq(projectMember.organizationId, orgId), eq(projectMember.projectId, projectId)),
          );
        for (const memberId of leadIds)
          await tx
            .insert(projectMember)
            .values({ organizationId: orgId, projectId, memberId, role: "admin" })
            .onConflictDoUpdate({
              target: [projectMember.projectId, projectMember.memberId],
              set: { role: "admin" },
            });
      }
      return updated;
    });
  }

  async deleteProject(orgId: string, projectId: string) {
    await this.access.requireProject(orgId, projectId);
    await this.db
      .delete(project)
      .where(and(eq(project.organizationId, orgId), eq(project.id, projectId)));
  }
}
