import { Inject, Injectable, Logger } from "@nestjs/common";
import { API_ENV } from "../../common/config/env.module";
import type { ApiEnv } from "../../common/config/env";
import type { EmailTheme, RenderedEmail } from "./templates/layout";

export type SendResult = { id: string; status: string; sandbox: boolean };

@Injectable()
export class SendByteService {
  private readonly logger = new Logger(SendByteService.name);

  constructor(@Inject(API_ENV) private readonly env: ApiEnv) {}

  get enabled(): boolean {
    return Boolean(this.env.SENDBYTE_API_KEY && this.env.SENDBYTE_FROM);
  }

  async send(input: {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
    cc?: string[];
    bcc?: string[];

    idempotencyKey?: string;
    tags?: string[];
  }): Promise<SendResult | null> {
    if (!this.enabled) {
      this.logger.warn(`SENDBYTE_API_KEY/SENDBYTE_FROM unset — skipped "${input.subject}"`);
      return null;
    }

    const response = await fetch(`${this.env.SENDBYTE_API_BASE}/v1/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.env.SENDBYTE_API_KEY}`,
        "Content-Type": "application/json",
        ...(input.idempotencyKey ? { "Idempotency-Key": input.idempotencyKey } : {}),
      },
      body: JSON.stringify({
        from: this.env.SENDBYTE_FROM,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply_to: input.replyTo,
        cc: input.cc,
        bcc: input.bcc,
        tags: input.tags,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");

      this.logger.error(
        `SendByte rejected "${input.subject}" (${response.status}): ${detail.slice(0, 500)}`,
      );
      return null;
    }

    return (await response.json()) as SendResult;
  }

  async sendTemplate(input: {
    to: string;
    rendered: RenderedEmail;
    theme: EmailTheme;
    tags?: string[];
    idempotencyKey?: string;
  }): Promise<SendResult | null> {
    return this.send({
      to: input.to,
      subject: input.rendered.subject,
      html: input.rendered.html,
      text: input.rendered.text,
      replyTo: input.theme.supportEmail,
      tags: input.tags,
      idempotencyKey: input.idempotencyKey,
    });
  }
}
