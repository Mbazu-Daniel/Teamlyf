import { Inject, Injectable, Logger } from "@nestjs/common";
import { createTransport, type Transporter } from "nodemailer";
import { API_ENV } from "../config/env.module";
import type { ApiEnv } from "../config/env";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transport?: Transporter;
  constructor(@Inject(API_ENV) private readonly env: ApiEnv) { if (env.EMAIL_URL) this.transport = createTransport(env.EMAIL_URL); }
  async sendInvitation(to: string, organizationName: string, invitationId?: string) {
    const url = invitationId ? `${this.env.WEB_ORIGIN}/invitations/${invitationId}` : this.env.WEB_ORIGIN;
    if (!this.transport || !this.env.EMAIL_FROM) { this.logger.log(`Invitation email for ${to}: ${url}`); return; }
    await this.transport.sendMail({ from: this.env.EMAIL_FROM, to, subject: `You are invited to ${organizationName} on Teamlyf`, text: `You have been invited to ${organizationName}. Open ${url} to respond.` });
  }
}
