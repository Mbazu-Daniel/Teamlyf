import { Injectable } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { project, projectRepository, status } from "@teamlyf/db/project-schema";
import { and, eq } from "drizzle-orm";
import { DATABASE } from "../../common/db/db.provider";
import { ProjectAccessService } from "./project-access.service";
import { GithubAppService } from "./github-app.service";
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
    private readonly githubApp: GithubAppService,
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

  async getGithubRepository(orgId: string, projectId: string) {
    await this.access.requireProject(orgId, projectId);
    return this.db.query.projectRepository.findFirst({
      where: and(eq(projectRepository.organizationId, orgId), eq(projectRepository.projectId, projectId)),
    });
  }

  async connectGithubRepository(orgId: string, projectId: string, memberId: string, dto: ConnectGithubRepositoryDto) {
    await this.access.requireProject(orgId, projectId);
    const repositoryFullName = dto.repositoryFullName.trim();
    const defaultBranch = dto.defaultBranch.trim();
    const installationId = dto.installationId?.trim() || null;

    if (installationId) {
      const repository = await this.githubApp.getRepository(installationId, repositoryFullName);
      if (repository.fullName.toLowerCase() !== repositoryFullName.toLowerCase()) {
        throw new Error("GitHub repository name does not match the connected repository");
      }
    }

    const [connected] = await this.db
      .insert(projectRepository)
      .values({
        organizationId: orgId,
        projectId,
        repositoryId: dto.repositoryId,
        repositoryFullName,
        defaultBranch,
        baseBranch: dto.baseBranch?.trim() || defaultBranch,
        installationId,
        connectedByMemberId: memberId,
      })
      .onConflictDoUpdate({
        target: projectRepository.projectId,
        set: {
          repositoryId: dto.repositoryId,
          repositoryFullName,
          defaultBranch,
          baseBranch: dto.baseBranch?.trim() || defaultBranch,
          installationId,
          connectedByMemberId: memberId,
          updatedAt: new Date(),
        },
      })
      .returning();
    return connected;
  }

  async disconnectGithubRepository(orgId: string, projectId: string) {
    await this.access.requireProject(orgId, projectId);
    await this.db.delete(projectRepository).where(
      and(eq(projectRepository.organizationId, orgId), eq(projectRepository.projectId, projectId)),
    );
  }

  async deleteProject(orgId: string, projectId: string) {
    await this.access.requireProject(orgId, projectId);
    await this.db
      .delete(project)
      .where(and(eq(project.organizationId, orgId), eq(project.id, projectId)));
  }
}
