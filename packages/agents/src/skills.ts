import { lstat, readdir, readFile } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";

export type AgentSkill = {
  name: string;
  description: string;
  instructions: string;
  path: string;
};

export type SkillSummary = Pick<AgentSkill, "name" | "description">;

export interface SkillCatalog {
  list(): Promise<readonly SkillSummary[]>;
  load(name: string): Promise<AgentSkill>;
}

const SKILL_ROOTS = [".teamlyf/skills", ".agents/skills", ".claude/skills", "skills"] as const;
const MAX_SKILL_BYTES = 128 * 1024;
const MAX_SKILLS = 100;

export class WorkspaceSkillCatalog implements SkillCatalog {
  private readonly cache = new Map<string, AgentSkill>();

  constructor(private readonly workspaceRoot: string) {}

  async list(): Promise<readonly SkillSummary[]> {
    const skills = await this.discover();
    return skills.map(({ name, description }) => ({ name, description }));
  }

  async load(name: string): Promise<AgentSkill> {
    if (!isSkillName(name)) throw new Error("Invalid skill name");
    const cached = this.cache.get(name);
    if (cached) return cached;

    const skill = (await this.discover()).find((candidate) => candidate.name === name);
    if (!skill) throw new Error(`Skill '${name}' was not found in the workspace`);
    this.cache.set(name, skill);
    return skill;
  }

  private async discover(): Promise<AgentSkill[]> {
    const root = resolve(this.workspaceRoot);
    const found: AgentSkill[] = [];

    for (const relativeRoot of SKILL_ROOTS) {
      if (found.length >= MAX_SKILLS) break;
      const directory = resolve(root, relativeRoot);
      if (!isInside(root, directory)) continue;
      await this.scanDirectory(directory, root, found);
    }

    return [...new Map(found.map((skill) => [skill.name, skill])).values()];
  }

  private async scanDirectory(directory: string, workspaceRoot: string, found: AgentSkill[]): Promise<void> {
    if (found.length >= MAX_SKILLS) return;

    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (isMissingPath(error)) return;
      throw error;
    }

    for (const entry of entries) {
      if (found.length >= MAX_SKILLS) return;
      if (!entry.isDirectory() || entry.name.startsWith(".")) continue;

      const skillPath = join(directory, entry.name, "SKILL.md");
      try {
        const stat = await lstat(skillPath);
        if (!stat.isFile() || stat.size > MAX_SKILL_BYTES) continue;

        const parsed = parseSkill(await readFile(skillPath, "utf8"));
        if (!parsed) continue;

        found.push({
          ...parsed,
          path: relative(workspaceRoot, skillPath).split(sep).join("/"),
        });
      } catch (error) {
        if (isMissingPath(error)) continue;
        throw error;
      }
    }
  }
}

function parseSkill(content: string): Omit<AgentSkill, "path"> | undefined {
  const normalized = content.replace(/^\uFEFF/, "");
  const match = normalized.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) return undefined;

  const frontmatter = parseFrontmatter(match[1]);
  const name = frontmatter.name;
  const description = frontmatter.description;
  const instructions = match[2].trim();

  if (!name || !description || !instructions || !isSkillName(name)) return undefined;
  return { name, description, instructions };
}

function parseFrontmatter(value: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of value.split("\n")) {
    const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
    if (!match) continue;
    result[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }
  return result;
}

function isSkillName(value: string): boolean {
  return /^[a-z0-9][a-z0-9._-]{0,63}$/.test(value);
}

function isInside(root: string, candidate: string): boolean {
  return candidate === root || candidate.startsWith(root + sep);
}

function isMissingPath(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
