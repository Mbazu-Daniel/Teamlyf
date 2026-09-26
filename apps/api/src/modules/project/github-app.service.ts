import { Inject, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { createSign } from "node:crypto";
import { API_ENV } from "../../common/config/env.module";
import type { ApiEnv } from "../../common/config/env";

type InstallationToken = {
  token: string;
  expiresAt: number;
};

@Injectable()
export class GithubAppService {
  private readonly tokens = new Map<string, InstallationToken>();

  constructor(@Inject(API_ENV) private readonly env: ApiEnv) {}

  async getInstallationToken(installationId: string): Promise<string> {
    const cached = this.tokens.get(installationId);
    if (cached && cached.expiresAt > Date.now() + 60_000) {
      return cached.token;
    }

    const appId = this.env.GITHUB_APP_ID;
    const privateKey = this.env.GITHUB_APP_PRIVATE_KEY;
    if (!appId || !privateKey) {
      throw new ServiceUnavailableException("GitHub App is not configured");
    }

    const jwt = this.createAppJwt(appId, privateKey);
    const response = await fetch(
      `https://api.github.com/app/installations/${encodeURIComponent(installationId)}/access_tokens`,
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${jwt}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );

    if (!response.ok) {
      throw new ServiceUnavailableException(
        `GitHub installation authentication failed (${response.status})`,
      );
    }

    const body = (await response.json()) as { token?: string; expires_at?: string };
    if (!body.token || !body.expires_at) {
      throw new ServiceUnavailableException("GitHub returned an invalid installation token");
    }

    const token = { token: body.token, expiresAt: Date.parse(body.expires_at) };
    this.tokens.set(installationId, token);
    return token.token;
  }

  private createAppJwt(appId: number, privateKey: string): string {
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ iat: now - 30, exp: now + 540, iss: appId })).toString(
      "base64url",
    );
    const unsigned = header + "." + payload;
    const signer = createSign("RSA-SHA256");
    signer.update(unsigned);
    return unsigned + "." + signer.sign(privateKey, "base64url");
  }
}
