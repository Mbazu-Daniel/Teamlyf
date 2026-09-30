import { Inject, Injectable } from "@nestjs/common";
import { API_ENV } from "../../common/config/env.module";
import type { ApiEnv } from "../../common/config/env";
import { SendByteService } from "./sendbyte.service";
import {
  reportReadyTemplate,
  resetPasswordTemplate,
  verifyEmailTemplate,
  welcomeTemplate,
  workspaceInviteTemplate,
  type ReportReadyEmail,
  type ResetPasswordEmail,
  type VerifyEmail,
  type WelcomeEmail,
  type WorkspaceInviteEmail,
} from "./templates";
import type { EmailTheme } from "./templates/layout";

@Injectable()
export class MailService {
  private readonly theme: EmailTheme;

  constructor(
    private readonly sendbyte: SendByteService,
    @Inject(API_ENV) env: ApiEnv,
  ) {
    this.theme = {
      appUrl: env.SENDBYTE_PUBLIC_URL ?? env.WEB_ORIGIN,
      productName: "Teamlyf",
      supportEmail: env.SENDBYTE_FROM?.match(/<([^>]+)>/)?.[1],
    };
  }

  sendWelcome(to: string, props: WelcomeEmail) {
    return this.sendbyte.sendTemplate({
      to,
      rendered: welcomeTemplate(this.theme, props),
      theme: this.theme,
      tags: ["welcome"],
    });
  }

  sendVerification(to: string, props: VerifyEmail) {
    return this.sendbyte.sendTemplate({
      to,
      rendered: verifyEmailTemplate(this.theme, props),
      theme: this.theme,
      tags: ["verify-email"],

      idempotencyKey: `verify:${to}:${props.token}`,
    });
  }

  sendPasswordReset(to: string, props: ResetPasswordEmail) {
    return this.sendbyte.sendTemplate({
      to,
      rendered: resetPasswordTemplate(this.theme, props),
      theme: this.theme,
      tags: ["reset-password"],
      idempotencyKey: `reset:${to}:${props.token}`,
    });
  }

  sendWorkspaceInvite(to: string, props: WorkspaceInviteEmail) {
    return this.sendbyte.sendTemplate({
      to,
      rendered: workspaceInviteTemplate(this.theme, props),
      theme: this.theme,
      tags: ["workspace-invite"],
      idempotencyKey: `invite:${props.workspaceName}:${to}:${props.token}`,
    });
  }

  sendReportReady(to: string, props: ReportReadyEmail) {
    return this.sendbyte.sendTemplate({
      to,
      rendered: reportReadyTemplate(this.theme, props),
      theme: this.theme,
      tags: ["report-ready"],
    });
  }
}
