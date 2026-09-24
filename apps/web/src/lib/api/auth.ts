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
export function signInSocial(body: { provider: "google"; callbackURL?: string }) {
  return client.request<SocialSignInResult>("/auth/sign-in/social", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
