export type EmailTheme = {
  appUrl: string;
  productName?: string;
  fromName?: string;
  supportEmail?: string;
};

export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

const BRAND_VIOLET = "#5400DB";
const INK = "#1A1A1F";
const MUTED = "#6B7280";
const BORDER = "#E5E7EB";

function appUrl(theme: EmailTheme): string {
  return theme.appUrl.replace(/\/+$/, "");
}

function link(theme: EmailTheme, path: string): string {
  return `${appUrl(theme)}${path.startsWith("/") ? path : `/${path}`}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function button(theme: EmailTheme, label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0;"><tr><td style="border-radius:8px;background:${BRAND_VIOLET};">
<a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 24px;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">${escapeHtml(label)}</a>
</td></tr></table>`;
}

function fallbackLink(href: string): string {
  return `<p style="margin:24px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:18px;color:${MUTED};word-break:break-all;">If the button does not work, paste this link into your browser:<br><a href="${escapeHtml(href)}" style="color:${BRAND_VIOLET};">${escapeHtml(href)}</a></p>`;
}

function shell(theme: EmailTheme, heading: string, body: string): string {
  const product = theme.productName ?? "Teamlyf";
  const year = new Date().getFullYear();
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(heading)}</title></head>
<body style="margin:0;padding:0;background:#F5F5F7;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:32px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid ${BORDER};border-radius:12px;overflow:hidden;">
<tr><td style="padding:28px 32px 8px;">
<p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:18px;font-weight:800;letter-spacing:-0.02em;color:${INK};">${escapeHtml(product)}</p>
</td></tr>
<tr><td style="padding:8px 32px 24px;">
<h1 style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:22px;line-height:28px;font-weight:700;color:${INK};">${escapeHtml(heading)}</h1>
${body}
</td></tr>
<tr><td style="padding:20px 32px 28px;border-top:1px solid ${BORDER};">
<p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:18px;color:${MUTED};">© ${year} ${escapeHtml(product)}${theme.supportEmail ? ` · <a href="mailto:${escapeHtml(theme.supportEmail)}" style="color:${MUTED};">${escapeHtml(theme.supportEmail)}</a>` : ""}</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:24px;color:${INK};">${text}</p>`;
}

function mutedParagraph(text: string): string {
  return `<p style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:22px;color:${MUTED};">${text}</p>`;
}

export function renderEmail(input: {
  theme: EmailTheme;
  subject: string;
  heading: string;

  bodyHtml: string;

  bodyText: string;
}): RenderedEmail {
  return {
    subject: input.subject,
    html: shell(input.theme, input.heading, input.bodyHtml),
    text: `${input.heading}\n\n${input.bodyText}\n\n© ${new Date().getFullYear()} ${
      input.theme.productName ?? "Teamlyf"
    }`,
  };
}

export { button, fallbackLink, link, mutedParagraph, paragraph, escapeHtml };
