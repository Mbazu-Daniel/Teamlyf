import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { dirname, relative } from "node:path";
import type {
  AgentSession,
  AgentToolCall,
  AgentToolExecutor,
  AgentToolResult,
} from "./runtime";
import {
  resolveWorkspacePath,
  type WorkspaceCommandRunner,
  type WorkspaceHandle,
} from "./workspace";

export type WorkspaceToolExecutorOptions = {
  commandRunner: WorkspaceCommandRunner;
  getWorkspace: (session: AgentSession) => WorkspaceHandle;
};

export class WorkspaceToolExecutor implements AgentToolExecutor {
  constructor(private readonly options: WorkspaceToolExecutorOptions) {}

  async execute(session: AgentSession, call: AgentToolCall): Promise<AgentToolResult> {
    try {
      const workspace = this.options.getWorkspace(session);
      const output = await this.executeTool(workspace, call);
      return { toolCallId: call.id, name: call.name, ok: true, output };
    } catch (error) {
      return {
        toolCallId: call.id,
        name: call.name,
        ok: false,
        output: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async executeTool(workspace: WorkspaceHandle, call: AgentToolCall): Promise<unknown> {
    switch (call.name) {
      case "read_file":
        return readFile(resolveWorkspacePath(workspace.root, stringArg(call, "path")), "utf8");

      case "write_file": {
        const path = resolveWorkspacePath(workspace.root, stringArg(call, "path"));
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, stringArg(call, "content"), "utf8");
        return { path: relative(workspace.root, path), changed: true };
      }

      case "edit_file": {
        const path = resolveWorkspacePath(workspace.root, stringArg(call, "path"));
        const content = await readFile(path, "utf8");
        const oldText = stringArg(call, "oldText");
        const count = content.split(oldText).length - 1;
        if (count !== 1) {
          throw new Error(`Expected exactly one match in ${stringArg(call, "path")}, found ${count}`);
        }
        await writeFile(path, content.replace(oldText, stringArg(call, "newText")), "utf8");
        return { path: relative(workspace.root, path), changed: true };
      }

      case "list_directory": {
        const path = resolveWorkspacePath(workspace.root, optionalStringArg(call, "path") ?? ".");
        const entries = await readdir(path, { withFileTypes: true });
        return entries.map((entry) => ({
          name: entry.name,
          type: entry.isDirectory() ? "directory" : "file",
        }));
      }

      case "search_files": {
        const query = stringArg(call, "query");
        const result = await this.options.commandRunner.run(
          workspace,
          "grep",
          ["-RIn", "--exclude-dir=.git", query, "."],
        );
        return { ...result, matches: result.exitCode === 0 };
      }

      case "execute_command":
        return this.options.commandRunner.run(
          workspace,
          stringArg(call, "command"),
        );

      case "git_status":
        return this.runGit(workspace, ["status", "--short", "--branch"]);

      case "git_diff":
        return this.runGit(workspace, ["diff", "--no-ext-diff"]);

      case "git_create_branch":
        return this.runGit(workspace, ["switch", "-c", stringArg(call, "branch")]);

      case "git_checkout":
        return this.runGit(workspace, ["switch", stringArg(call, "branch")]);

      case "git_commit":
        return this.runGit(workspace, ["commit", "-am", stringArg(call, "message")]);

      case "git_push":
        return this.runGit(workspace, ["push", "--set-upstream", "origin", workspace.workingBranch]);

      default:
        throw new Error(`Tool ${call.name} is not implemented by the workspace executor`);
    }
  }

  private runGit(workspace: WorkspaceHandle, args: readonly string[]) {
    return this.options.commandRunner.run(workspace, "git", args);
  }
}

function stringArg(call: AgentToolCall, key: string): string {
  const value = call.arguments[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Tool argument '${key}' must be a non-empty string`);
  }
  return value;
}

function optionalStringArg(call: AgentToolCall, key: string): string | undefined {
  const value = call.arguments[key];
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new Error(`Tool argument '${key}' must be a string`);
  }
  return value;
}
