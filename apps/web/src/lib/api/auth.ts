import { client } from "./client";

type Session = { user?: { id: string; name?: string | null; email?: string | null } } | null;

export function getSession() {
  return client.request<Session>("/auth/session");
}

export function signInEmail(body: { email: string; password: string; rememberMe?: boolean }) {
  return client.request<unknown>("/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function signUpEmail(body: { name?: string; email: string; password: string }) {
  return client.request<unknown>("/auth/sign-up/email", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function signOut() {
  return client.request<unknown>("/auth/sign-out", { method: "POST" });
}

type SocialSignInResult = { url?: string; redirect?: boolean };

/** better-auth social sign-in. Returns the Google consent URL to redirect the browser to. */
export function signInSocial(body: { provider: "google"; callbackURL?: string; errorCallbackURL?: string }) {
  return client.request<SocialSignInResult>("/auth/sign-in/social", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateUser(body: { name?: string; image?: string }) {
  return client.request<unknown>("/auth/update-user", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function changePassword(body: { currentPassword: string; newPassword: string; revokeOtherSessions?: boolean }) {
  return client.request<unknown>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function forgotPassword(body: { email: string; redirectTo?: string }) {
  return client.request<unknown>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function resetPassword(body: { newPassword: string; token: string }) {
  return client.request<unknown>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type SessionSummary = { id: string; token: string; createdAt: string; updatedAt: string; ipAddress?: string; userAgent?: string };

export function listSessions() {
  return client.request<SessionSummary[]>("/auth/sessions");
}

/** Signs out one device. Pass the session's own token. */
export function revokeSession(token: string) {
  return client.request<unknown>("/auth/sessions/revoke", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

/** Signs out every device except the one making the call. */
export function revokeOtherSessions() {
  return client.request<unknown>("/auth/sessions/revoke-others", { method: "POST" });
}
