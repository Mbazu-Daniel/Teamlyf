import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  changePassword,
  forgotPassword,
  getSession,
  listSessions,
  resetPassword,
  revokeOtherSessions,
  revokeSession,
  signInEmail,
  signInSocial,
  signOut,
  signUpEmail,
  updateUser,
} from "@/lib/api";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

type Call = { method: string; url: string; body: string | null };

function stubFetch(response: Response) {
  const fetchMock = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
    Promise.resolve(response),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** Stub fetch with a 200 and capture the single call the client must have made. */
async function captureCall(run: () => Promise<unknown>): Promise<Call> {
  const fetchMock = stubFetch(
    new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
  await run();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [input, init] = fetchMock.mock.calls[0]!;
  return {
    method: init?.method ?? "GET",
    url: String(input),
    body: typeof init?.body === "string" ? init.body : null,
  };
}

function jsonResponse(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("auth endpoints", () => {
  it("signUpEmail_postsToTheSignUpRoute_withCredentials", async () => {
    const call = await captureCall(() => signUpEmail({ email: "a@b.com", password: "pw12345678" }));
    expect(call.method).toBe("POST");
    expect(call.url).toMatch(/\/auth\/sign-up\/email$/);
    expect(JSON.parse(call.body ?? "")).toEqual({ email: "a@b.com", password: "pw12345678" });
  });

  it("signInEmail_postsToTheSignInRoute", async () => {
    const call = await captureCall(() => signInEmail({ email: "a@b.com", password: "pw12345678" }));
    expect(call.method).toBe("POST");
    expect(call.url).toBe("/api/v1/auth/sign-in/email");
  });

  it("signInEmail_whenApiBaseIsBlank_postsToTheVersionedSameOriginRoute", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_API_URL", "");
    const { signInEmail: signInWithBlankApiBase } = await import("@/lib/api/auth");

    const call = await captureCall(() =>
      signInWithBlankApiBase({ email: "a@b.com", password: "pw12345678" }),
    );

    expect(call.url).toBe("/api/v1/auth/sign-in/email");
  });

  it("signInSocial_postsToTheSocialRoute_andKeepsTheCallbackUrl", async () => {
    const call = await captureCall(() =>
      signInSocial({ provider: "google", callbackURL: "http://localhost:3100/projects" }),
    );
    expect(call.method).toBe("POST");
    expect(call.url).toMatch(/\/auth\/sign-in\/social$/);
    expect(JSON.parse(call.body ?? "")).toEqual({
      provider: "google",
      callbackURL: "http://localhost:3100/projects",
    });
  });

  it("signOut_postsToTheSignOutRoute", async () => {
    const call = await captureCall(() => signOut());
    expect(call.method).toBe("POST");
    expect(call.url).toMatch(/\/auth\/sign-out$/);
  });

  it("getSession_hitsTheSessionRoute_withGet", async () => {
    const call = await captureCall(() => getSession());
    expect(call.method).toBe("GET");
    expect(call.url).toMatch(/\/auth\/session$/);
  });

  it("updateUser_postsOnlyTheProvidedFields", async () => {
    const call = await captureCall(() => updateUser({ name: "New Name" }));
    expect(call.url).toMatch(/\/auth\/update-user$/);
    expect(JSON.parse(call.body ?? "")).toEqual({ name: "New Name" });
  });

  it("changePassword_postsCurrentAndNewPasswords", async () => {
    const call = await captureCall(() =>
      changePassword({ currentPassword: "old12345", newPassword: "new12345" }),
    );
    expect(call.url).toMatch(/\/auth\/change-password$/);
    expect(JSON.parse(call.body ?? "")).toEqual({
      currentPassword: "old12345",
      newPassword: "new12345",
    });
  });

  it("forgotPassword_postsTheEmail", async () => {
    const call = await captureCall(() => forgotPassword({ email: "a@b.com" }));
    expect(call.url).toMatch(/\/auth\/forgot-password$/);
    expect(JSON.parse(call.body ?? "")).toEqual({ email: "a@b.com" });
  });

  it("resetPassword_postsTheTokenWithTheNewPassword", async () => {
    const call = await captureCall(() =>
      resetPassword({ newPassword: "new12345", token: "tok_1" }),
    );
    expect(call.url).toMatch(/\/auth\/reset-password$/);
    expect(JSON.parse(call.body ?? "")).toEqual({ newPassword: "new12345", token: "tok_1" });
  });

  it("listSessions_hitsTheSessionsRoute_withGet", async () => {
    const call = await captureCall(() => listSessions());
    expect(call.method).toBe("GET");
    expect(call.url).toMatch(/\/auth\/sessions$/);
  });

  it("revokeSession_postsTheToken_toTheRevokeRoute", async () => {
    const call = await captureCall(() => revokeSession("tok_1"));
    expect(call.method).toBe("POST");
    expect(call.url).toMatch(/\/auth\/sessions\/revoke$/);
    expect(JSON.parse(call.body ?? "")).toEqual({ token: "tok_1" });
  });

  it("revokeOtherSessions_postsToTheRevokeOthersRoute_withoutABody", async () => {
    const call = await captureCall(() => revokeOtherSessions());
    expect(call.method).toBe("POST");
    expect(call.url).toMatch(/\/auth\/sessions\/revoke-others$/);
  });
});

/**
 * better-auth only mounts /sign-in/social for providers that have credentials,
 * so an unconfigured Google answers 404 with an *empty* body. SocialSignIn
 * branches on the status to say "add GOOGLE_CLIENT_ID"; that only works if the
 * status survives an empty body, which is what these pin down.
 */
describe("auth error mapping", () => {
  it("signInSocial_whenProviderIsNotConfigured_keepsThe404StatusFromAnEmptyBody", async () => {
    stubFetch(new Response("", { status: 404 }));

    const failure = await signInSocial({ provider: "google" }).catch((reason: unknown) => reason);

    expect(failure).toBeInstanceOf(ApiError);
    expect((failure as ApiError).status).toBe(404);
  });

  it("signInSocial_whenTheApiExplainsTheFailure_keepsTheApiMessage", async () => {
    stubFetch(jsonResponse(400, { message: "Provider not found" }));

    const failure = await signInSocial({ provider: "google" }).catch((reason: unknown) => reason);

    expect((failure as ApiError).message).toBe("Provider not found");
    expect((failure as ApiError).status).toBe(400);
  });

  it("signInEmail_whenThePasswordIsWrong_surfacesTheApiMessage", async () => {
    stubFetch(jsonResponse(401, { message: "Invalid email or password" }));

    const failure = await signInEmail({ email: "a@b.com", password: "nope" }).catch(
      (reason: unknown) => reason,
    );

    expect((failure as ApiError).message).toBe("Invalid email or password");
  });
});
