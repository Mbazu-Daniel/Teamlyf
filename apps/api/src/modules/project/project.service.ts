import { Injectable } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { project, projectRepository, status } from "@teamlyf/db/project-schema";
import { and, eq } from "drizzle-orm";
import { DATABASE } from "../../common/db/db.provider";
import { ProjectAccessService } from "./project-access.service";
import type { ConnectGithubRepositoryDto, CreateProjectDto, UpdateProjectDto } from "./dto";

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

  async createProject(orgId: string, dto: CreateProjectDto) {
    const [created] = await this.db.insert(project).values({
      organizationId: orgId,
      name: dto.name,
      identifier: dto.identifier.toUpperCase(),
      description: dto.description ?? null,
      emoji: dto.emoji ?? null,
    }).returning();

    await this.createDefaultStatuses(created.id);
    return created;
  }

  private createDefaultStatuses(projectId: string) {
    return this.db.insert(status).values(
      DEFAULT_STATUSES.map((item) => ({
        projectId,
        name: item.name,
        color: item.color,
        group: item.group,
        sequence: item.sequence,
        default: item.default ?? false,
      })),
    );
  }

  async getProjects(orgId: string) {
    return this.db.query.project.findMany({
      where: eq(project.organizationId, orgId),
      orderBy: (p, { desc }) => [desc(p.createdAt)],
    });
  }

  async getProject(orgId: string, projectId: string) {
    return this.access.requireProject(orgId, projectId);
  }

  async updateProject(orgId: string, projectId: string, dto: UpdateProjectDto) {
    await this.access.requireProject(orgId, projectId);
    const [updated] = await this.db
      .update(project)
      .set({ ...dto, updatedAt: new Date() })
      .where(and(eq(project.organizationId, orgId), eq(project.id, projectId)))
      .returning();
    return updated;
  }

  async getGithubRepository(orgId: string, projectId: string) {\n    await this.access.requireProject(orgId, projectId);\n    return this.db.query.projectRepository.findFirst({\n      where: and(eq(projectRepository.organizationId, orgId), eq(projectRepository.projectId, projectId)),\n    });\n  }\n\n  async connectGithubRepository(orgId: string, projectId: string, memberId: string, dto: ConnectGithubRepositoryDto) {\n    await this.access.requireProject(orgId, projectId);\n    const [connected] = await this.db\n      .insert(projectRepository)\n      .values({\n        organizationId: orgId,\n        projectId,\n        repositoryId: dto.repositoryId,\n        repositoryFullName: dto.repositoryFullName.trim(),\n        defaultBranch: dto.defaultBranch.trim(),\n        baseBranch: dto.baseBranch?.trim() || dto.defaultBranch.trim(),\n        installationId: dto.installationId?.trim() || null,\n        connectedByMemberId: memberId,\n      })\n      .onConflictDoUpdate({\n        target: projectRepository.projectId,\n        set: {\n          repositoryId: dto.repositoryId,\n          repositoryFullName: dto.repositoryFullName.trim(),\n          defaultBranch: dto.defaultBranch.trim(),\n          baseBranch: dto.baseBranch?.trim() || dto.defaultBranch.trim(),\n          installationId: dto.installationId?.trim() || null,\n          connectedByMemberId: memberId,\n          updatedAt: new Date(),\n        },\n      })\n      .returning();\n    return connected;\n  }\n\n  async disconnectGithubRepository(orgId: string, projectId: string) {\n    await this.access.requireProject(orgId, projectId);\n    await this.db.delete(projectRepository).where(\n      and(eq(projectRepository.organizationId, orgId), eq(projectRepository.projectId, projectId)),\n    );\n  }\n\n  async deleteProject(orgId: string, projectId: string) {
    await this.access.requireProject(orgId, projectId);
    await this.db
      .delete(project)
      .where(and(eq(project.organizationId, orgId), eq(project.id, projectId)));
  }
}
