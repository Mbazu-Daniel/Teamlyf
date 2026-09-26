import { spawn } from "node:child_process";
import type { AgentSandbox, SandboxLimits, SandboxOptions } from "./sandbox";
import {
  DEFAULT_SANDBOX_LIMITS,
  DEFAULT_SANDBOX_OPTIONS,
} from "./sandbox";
import type { CommandResult, WorkspaceHandle } from "./workspace";

const WORKSPACE_MOUNT = "/workspace";

export class DockerAgentSandbox implements AgentSandbox {
  private readonly options: SandboxOptions;

  constructor(options: Partial<SandboxOptions> = {}) {
    this.options = {
      ...DEFAULT_SANDBOX_OPTIONS,
      ...options,
      limits: {
        ...DEFAULT_SANDBOX_LIMITS,
        ...options.limits,
      },
    };
  }

  async start(workspace: WorkspaceHandle): Promise<void> {
    await this.runDocker(["create", ...this.containerOptions(workspace), "sleep", "infinity"]);
    await this.runDocker(["start", this.containerName(workspace)]);
  }

  async run(
    workspace: WorkspaceHandle,
    command: string,
    args: readonly string[] = [],
    options: Partial<SandboxLimits> = {},
  ): Promise<CommandResult> {
    const limits = { ...this.options.limits, ...options };
    return this.runDockerCommand(
      ["exec", this.containerName(workspace), command, ...args],
      limits,
    );
  }

  async stop(workspace: WorkspaceHandle): Promise<void> {
    await this.runDocker(["rm", "-f", this.containerName(workspace)]);
  }

  private containerOptions(workspace: WorkspaceHandle): string[] {
    const limits = this.options.limits;
    const network =
      this.options.network === "none" ? ["--network", "none"] : [];
    return [
      "--name",
      this.containerName(workspace),
      "--cap-drop",
      "ALL",
      "--security-opt",
      "no-new-privileges:true",
      "--memory",
      limits.memoryMb + "m",
      "--cpus",
      String(limits.cpuCount),
      "--pids-limit",
      String(limits.pidsLimit),
      ...network,
      "--mount",
      "type=bind,src=" + workspace.root + ",dst=" + WORKSPACE_MOUNT,
      "--workdir",
      WORKSPACE_MOUNT,
      "--user",
      "1000:1000",
      this.options.image,
    ];
  }

  private containerName(workspace: WorkspaceHandle): string {
    return "teamlyf-agent-" + workspace.root.split("/").pop();
  }

  private runDockerCommand(
    args: readonly string[],
    limits: SandboxLimits,
  ): Promise<CommandResult> {
    return runProcess("docker", args, limits.timeoutMs, limits.maxOutputBytes);
  }

  private runDocker(args: readonly string[]): Promise<CommandResult> {
    return runProcess(
      "docker",
      args,
      this.options.limits.timeoutMs,
      this.options.limits.maxOutputBytes,
    ).then((result) => {
      if (result.exitCode !== 0) {
        throw new Error(result.stderr || "Docker command failed");
      }
      return result;
    });
  }
}

function runProcess(
  command: string,
  args: readonly string[],
  timeoutMs: number,
  maxOutputBytes: number,
): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, [...args], { shell: false });
    let stdout = "";
    let stderr = "";
    let totalBytes = 0;
    let settled = false;

    const finishError = (error: unknown) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.kill("SIGKILL");
      reject(error);
    };

    const append = (current: string, chunk: Buffer): string => {
      totalBytes += chunk.byteLength;
      if (totalBytes > maxOutputBytes) {
        throw new Error("Sandbox output exceeded the configured limit");
      }
      return current + chunk.toString("utf8");
    };

    const timer = setTimeout(() => {
      finishError(new Error("Sandbox command timed out after " + timeoutMs + "ms"));
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      try {
        stdout = append(stdout, chunk);
      } catch (error) {
        finishError(error);
      }
    });
    child.stderr.on("data", (chunk: Buffer) => {
      try {
        stderr = append(stderr, chunk);
      } catch (error) {
        finishError(error);
      }
    });
    child.on("error", finishError);
    child.on("close", (exitCode) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ exitCode: exitCode ?? -1, stdout, stderr });
    });
  });
}
