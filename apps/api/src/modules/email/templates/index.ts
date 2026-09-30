import {
  button,
  escapeHtml,
  fallbackLink,
  link,
  mutedParagraph,
  paragraph,
  renderEmail,
  type EmailTheme,
  type RenderedEmail,
} from "./layout";

export type WelcomeEmail = { name: string; workspaceName?: string };

export function welcomeTemplate(theme: EmailTheme, props: WelcomeEmail): RenderedEmail {
  const href = link(theme, "/workspaces");
  return renderEmail({
    theme,
    subject: `Welcome to ${theme.productName ?? "Teamlyf"}`,
    heading: `Welcome, ${props.name}`,
    bodyHtml: [
      paragraph(
        `Your account is ready. ${escapeHtml(props.workspaceName ?? "Create your first workspace")} and start organising projects, tasks and chat in one place.`,
      ),
      button(theme, "Open Teamlyf", href),
      fallbackLink(href),
    ].join(""),
    bodyText: `Your account is ready. Open ${href} to get started.`,
  });
}

export type VerifyEmail = { name: string; token: string };

export function verifyEmailTemplate(theme: EmailTheme, props: VerifyEmail): RenderedEmail {
  const href = link(theme, `/verify-email?token=${encodeURIComponent(props.token)}`);
  return renderEmail({
    theme,
    subject: "Confirm your email address",
    heading: "Confirm your email",
    bodyHtml: [
      paragraph(
        `Hi ${escapeHtml(props.name)}, confirm this address to finish setting up your account.`,
      ),
      button(theme, "Confirm email", href),
      fallbackLink(href),
      mutedParagraph("If you did not create a Teamlyf account, you can ignore this email."),
    ].join(""),
    bodyText: `Hi ${props.name}, confirm your email address: ${href}`,
  });
}

export type ResetPasswordEmail = { name: string; token: string };

export function resetPasswordTemplate(theme: EmailTheme, props: ResetPasswordEmail): RenderedEmail {
  const href = link(theme, `/reset-password?token=${encodeURIComponent(props.token)}`);
  return renderEmail({
    theme,
    subject: "Reset your password",
    heading: "Reset your password",
    bodyHtml: [
      paragraph(`Hi ${escapeHtml(props.name)}, use the link below to choose a new password.`),
      button(theme, "Choose a new password", href),
      fallbackLink(href),
      mutedParagraph(
        "This link expires shortly. If you did not request a reset, no action is needed and your password stays as it is.",
      ),
    ].join(""),
    bodyText: `Hi ${props.name}, reset your password here: ${href}`,
  });
}

export type WorkspaceInviteEmail = {
  workspaceName: string;
  inviterName: string;
  role: string;
  token: string;
};

export function workspaceInviteTemplate(
  theme: EmailTheme,
  props: WorkspaceInviteEmail,
): RenderedEmail {
  const href = link(theme, `/accept-invite?token=${encodeURIComponent(props.token)}`);
  return renderEmail({
    theme,
    subject: `${props.inviterName} invited you to ${props.workspaceName}`,
    heading: `Join ${props.workspaceName}`,
    bodyHtml: [
      paragraph(
        `${escapeHtml(props.inviterName)} invited you to join <strong>${escapeHtml(props.workspaceName)}</strong> as ${escapeHtml(props.role)}.`,
      ),
      button(theme, "Accept invitation", href),
      fallbackLink(href),
      mutedParagraph("If you were not expecting this invitation, ignore this email."),
    ].join(""),
    bodyText: `${props.inviterName} invited you to join ${props.workspaceName} as ${props.role}: ${href}`,
  });
}

export type ReportReadyEmail = { name: string; reportName: string; downloadUrl: string };

export function reportReadyTemplate(theme: EmailTheme, props: ReportReadyEmail): RenderedEmail {
  return renderEmail({
    theme,
    subject: `${props.reportName} is ready`,
    heading: "Your export is ready",
    bodyHtml: [
      paragraph(
        `Hi ${escapeHtml(props.name)}, <strong>${escapeHtml(props.reportName)}</strong> finished generating.`,
      ),
      button(theme, "Download", props.downloadUrl),
      fallbackLink(props.downloadUrl),
      mutedParagraph("The link is signed and expires, so download it while it is fresh."),
    ].join(""),
    bodyText: `Hi ${props.name}, ${props.reportName} is ready: ${props.downloadUrl}`,
  });
}

export const EMAIL_TEMPLATES = {
  welcome: welcomeTemplate,
  "verify-email": verifyEmailTemplate,
  "reset-password": resetPasswordTemplate,
  "workspace-invite": workspaceInviteTemplate,
  "report-ready": reportReadyTemplate,
} as const;

type EmailTemplateId = keyof typeof EMAIL_TEMPLATES;
