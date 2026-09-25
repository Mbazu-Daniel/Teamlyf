import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SecuritySettingsPage } from "@/features/settings/security";
import { renderComponent } from "./support/render-component";

afterEach(() => {
  vi.unstubAllGlobals();
});

const SESSIONS = [
  {
    id: "session-1",
    token: "token-one",
    createdAt: "2026-09-25T10:00:00.000Z",
    updatedAt: "2026-09-25T10:00:00.000Z",
    ipAddress: "10.0.0.1",
    userAgent: "Firefox on Linux",
  },
  {
    id: "session-2",
    token: "token-two",
    createdAt: "2026-09-25T11:00:00.000Z",
    updatedAt: "2026-09-25T11:00:00.000Z",
    ipAddress: "10.0.0.2",
    userAgent: "Safari on iPhone",
  },
];

/** Answers GET /auth/sessions with `sessions` and records every call. */
function stubApi(sessions: unknown[] = SESSIONS) {
  const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
    if (!init?.method || init.method === "GET") {
      return Promise.resolve(
        new Response(JSON.stringify(sessions), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }
    return Promise.resolve(new Response(JSON.stringify({ status: true }), { status: 200 }));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function postedCalls(fetchMock: ReturnType<typeof stubApi>) {
  return fetchMock.mock.calls
    .filter(([, init]) => Boolean(init?.method && init.method !== "GET"))
    .map(([input, init]) => ({ url: String(input), body: JSON.parse(String(init?.body ?? "{}")) }));
}

async function listLoaded() {
  return screen.findByText("Firefox on Linux");
}

describe("SecuritySettingsPage sessions", () => {
  it("listsEverySignedInDevice_withItsAddress", async () => {
    stubApi();
    renderComponent(<SecuritySettingsPage />);

    await listLoaded();

    expect(screen.getByText("Safari on iPhone")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Revoke" })).toHaveLength(2);
    expect(screen.getByText(/10\.0\.0\.1/)).toBeInTheDocument();
  });

  it("revokesOnlyTheChosenSession_whenOneRevokeButtonIsUsed", async () => {
    const user = userEvent.setup();
    const fetchMock = stubApi();
    renderComponent(<SecuritySettingsPage />);
    await listLoaded();

    const firefoxRow = screen.getByText("Firefox on Linux").closest("div")!.parentElement!;
    await user.click(within(firefoxRow).getByRole("button", { name: "Revoke" }));

    await waitFor(() => expect(postedCalls(fetchMock)).toHaveLength(1));
    expect(postedCalls(fetchMock)[0]).toEqual({
      url: expect.stringMatching(/\/auth\/sessions\/revoke$/),
      body: { token: "token-one" },
    });
  });

  it("signsOutEveryOtherDevice_whenTheHeaderActionIsUsed", async () => {
    const user = userEvent.setup();
    const fetchMock = stubApi();
    renderComponent(<SecuritySettingsPage />);
    await listLoaded();

    await user.click(screen.getByRole("button", { name: "Sign out other devices" }));

    await waitFor(() => expect(postedCalls(fetchMock)).toHaveLength(1));
    expect(postedCalls(fetchMock)[0].url).toMatch(/\/auth\/sessions\/revoke-others$/);
  });

  it("explainsTheFailure_whenRevokingIsRejected", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        if (!init?.method || init.method === "GET") {
          return Promise.resolve(
            new Response(JSON.stringify(SESSIONS), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
        return Promise.resolve(
          new Response(JSON.stringify({ message: "Session already revoked" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }),
    );
    renderComponent(<SecuritySettingsPage />);
    await listLoaded();

    const firefoxRow = screen.getByText("Firefox on Linux").closest("div")!.parentElement!;
    await user.click(within(firefoxRow).getByRole("button", { name: "Revoke" }));

    expect(await screen.findByText("Session already revoked")).toBeInTheDocument();
  });
});

describe("SecuritySettingsPage password change", () => {
  async function fillForm(user: ReturnType<typeof userEvent.setup>, confirm: string) {
    await user.type(screen.getByLabelText("Current password"), "OldPass12345");
    await user.type(screen.getByLabelText("New password"), "NewPass12345");
    await user.type(screen.getByLabelText("Confirm new password"), confirm);
    await user.click(screen.getByRole("button", { name: "Change password" }));
  }

  it("refusesTheSubmit_whenTheConfirmationDiffers", async () => {
    const user = userEvent.setup();
    const fetchMock = stubApi();
    renderComponent(<SecuritySettingsPage />);
    await listLoaded();

    await fillForm(user, "SomethingElse12345");

    expect(screen.getByText("The two new passwords do not match.")).toBeInTheDocument();
    expect(postedCalls(fetchMock)).toHaveLength(0);
  });

  it("changesThePassword_whenTheConfirmationMatches", async () => {
    const user = userEvent.setup();
    const fetchMock = stubApi();
    renderComponent(<SecuritySettingsPage />);
    await listLoaded();

    await fillForm(user, "NewPass12345");

    await waitFor(() => expect(postedCalls(fetchMock)).toHaveLength(1));
    expect(postedCalls(fetchMock)[0]).toEqual({
      url: expect.stringMatching(/\/auth\/change-password$/),
      body: {
        currentPassword: "OldPass12345",
        newPassword: "NewPass12345",
        revokeOtherSessions: true,
      },
    });
    expect(await screen.findByText(/password has been changed/i)).toBeInTheDocument();
  });

  it("keepsTheCurrentPasswordMessage_whenTheApiRejectsIt", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        if (!init?.method || init.method === "GET") {
          return Promise.resolve(
            new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } }),
          );
        }
        return Promise.resolve(
          new Response(JSON.stringify({ message: "Invalid password" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }),
    );
    renderComponent(<SecuritySettingsPage />);
    await waitFor(() => expect(screen.queryAllByRole("button", { name: "Revoke" })).toHaveLength(0));

    await fillForm(user, "NewPass12345");

    expect(await screen.findByText("Invalid password")).toBeInTheDocument();
  });
});
