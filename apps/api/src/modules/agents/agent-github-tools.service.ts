import { Injectable, NotFoundException } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { projectRepository } from "@teamlyf/db/project-schema";
import type { AgentSession, AgentToolCall, AgentToolRegistration } from "@teamlyf/agents";
import { and, eq } from "drizzle-orm";
import { DATABASE } from "../../common/db/db.provider";
import { GithubAppService } from "../project/github-app.service";

@Injectable()
export class AgentGithubToolsService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly github: GithubAppService,
  ) {}

  registrations(): AgentToolRegistration[] {
    return [
      {
        name: "github_get_pull_request",
        handler: (session, call) => this.getPullRequest(session, call),
      },
      {
        name: "github_create_pull_request",
        handler: (session, call) => this.createPullRequest(session, call),
      },
    ];
  }

  private async getPullRequest(session: AgentSession, call: AgentToolCall) {
    const number = this.number(call);
    const repository = await this.requireRepository(session);
    const token = await this.requireToken(repository.installationId);

    return this.githubRequest(
      token,
      `https://api.github.com/repos/${repository.repositoryFullName}/pulls/${number}`,
      { method: "GET" },
    );
  }

  private async createPullRequest(session: AgentSession, call: AgentToolCall) {
    const title = this.string(call, "title");
    const body = this.optionalString(call, "body") ?? "";
    const repository = await this.requireRepository(session);
    const head = session.workspace?.workingBranch;
    if (!head) throw new Error("A GitHub workspace branch is required to create a pull request.");
    if (!repository.baseBranch) throw new Error("The connected project repository has no base branch.");
    const token = await this.requireToken(repository.installationId);

    return this.githubRequest(
      token,
      `https://api.github.com/repos/${repository.repositoryFullName}/pulls`,
      {
        method: "POST",
        body: JSON.stringify({
          title,
          body,
          head,
          base: repository.baseBranch,
        }),
      },
    );
  }

  private async requireRepository(session: AgentSession) {
    const projectId = session.projectId ?? (session.context.type === "project" ? session.context.id : undefined);
    if (!projectId) throw new Error("GitHub tools require a project context.");

    const repository = await this.db.query.projectRepository.findFirst({
      where: and(
        eq(projectRepository.organizationId, session.organizationId),
        eq(projectRepository.projectId, projectId),
      ),
    });
    if (!repository) throw new NotFoundException("No GitHub repository is connected to this project.");
    return repository;
  }

  private async requireToken(installationId: string | null) {
    if (!installationId) throw new Error("The connected GitHub repository has no GitHub App installation.");
    return this.github.getInstallationToken(installationId);
  }

  private string(call: AgentToolCall, key: string): string {
    const value = call.arguments[key];
    if (typeof value !== "string" || !value.trim()) throw new Error(`${key} is required.`);
    return value.trim();
  }

  private optionalString(call: AgentToolCall, key: string): string | undefined {
    const value = call.arguments[key];
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
  }

  private number(call: AgentToolCall): number {
    const value = call.arguments.number;
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) throw new Error("number must be a positive integer.");
    return parsed;
  }

  private async githubRequest(token: string, url: string, init: RequestInit) {
    const response = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });

    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        body && typeof body === "object" && "message" in body && typeof body.message === "string"
          ? body.message
          : `GitHub request failed (${response.status})`;
      throw new Error(message);
    }
    return body;
  }
}
