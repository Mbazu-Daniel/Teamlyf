import { Inject, Injectable, Logger, OnApplicationShutdown } from "@nestjs/common";
import { Queue } from "bullmq";
import type { AgentTaskEnvelope } from "@teamlyf/types";
import { API_ENV } from "../../common/config/env.module";
import type { ApiEnv } from "../../common/config/env";

export const AGENT_QUEUE_NAME = "agent-tasks";

@Injectable()
export class AgentQueueService implements OnApplicationShutdown {
  private readonly logger = new Logger(AgentQueueService.name);
  private readonly queue?: Queue<AgentTaskEnvelope>;

  constructor(@Inject(API_ENV) env: ApiEnv) {
    if (env.REDIS_URL) {
      this.queue = new Queue<AgentTaskEnvelope>(AGENT_QUEUE_NAME, { connection: { url: env.REDIS_URL } });
    } else {
      this.logger.warn("REDIS_URL is unset; agent tasks will persist as queued until a worker is configured");
    }
  }

  async enqueue(task: AgentTaskEnvelope): Promise<void> {
    if (!this.queue) return;
    await this.queue.add("execute", task, {
      jobId: task.id,
      attempts: 3,
      backoff: { type: "exponential", delay: 1_000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    });
  }

  async onApplicationShutdown(): Promise<void> {
    await this.queue?.close();
  }
}
