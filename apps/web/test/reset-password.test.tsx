import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResetPasswordForm } from "@/routes/reset-password";
import { renderWithRouter } from "./support/render-component";

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Records the one API call the form makes and answers with `response`. */
function stubApi(response = new Response("", { status: 200 })) {
  const fetchMock = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
    Promise.resolve(response),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const TOKEN = "reset-token-1";

function renderForm(overrides: Partial<{ token: string; linkError: string }> = {}) {
  const onDone = vi.fn();
  const view = renderWithRouter(
    <ResetPasswordForm token={TOKEN} linkError="" onDone={onDone} {...overrides} />,
  );
  return { ...view, onDone };
}

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>, password: string, confirm: string) {
  await user.type(screen.getByLabelText("New password"), password);
  await user.type(screen.getByLabelText("Confirm new password"), confirm);
  await user.click(screen.getByRole("button", { name: "Set new password" }));
}

describe("ResetPasswordForm link states", () => {
  it("offersTheForm_whenTheLinkCarriesAToken", () => {
    renderForm();

    expect(screen.getByRole("button", { name: "Set new password" })).toBeInTheDocument();
  });

  it("explainsTheProviderError_whenTheLinkRejectsIt", () => {
    renderForm({ token: "", linkError: "access_denied" });

    expect(screen.getByText("That reset link is no longer valid")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Set new password" })).not.toBeInTheDocument();
  });

  it("asksForANewLink_whenTheTokenIsMissing", () => {
    renderForm({ token: "" });

    expect(screen.getByText("This link is missing its token")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Request a new link" })).toBeInTheDocument();
  });
});

describe("ResetPasswordForm submission", () => {
  it("refusesTheSubmit_whenTheTwoPasswordsDiffer", async () => {
    const user = userEvent.setup();
    const fetchMock = stubApi();
    renderForm();

    await fillAndSubmit(user, "NewPass12345", "Different12345");

    expect(screen.getByRole("alert")).toHaveTextContent("The two passwords do not match.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("postsTheTokenWithTheNewPassword_whenBothEntriesMatch", async () => {
    const user = userEvent.setup();
    const fetchMock = stubApi();
    renderForm();

    await fillAndSubmit(user, "NewPass12345", "NewPass12345");

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [input, init] = fetchMock.mock.calls[0]!;
    expect(String(input)).toMatch(/\/auth\/reset-password$/);
    expect(JSON.parse(String(init?.body))).toEqual({ newPassword: "NewPass12345", token: TOKEN });
  });

  it("reportsTheApiMessage_whenTheResetIsRejected", async () => {
    const user = userEvent.setup();
    stubApi(
      new Response(JSON.stringify({ message: "Invalid token" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const { onDone } = renderForm();

    await fillAndSubmit(user, "NewPass12345", "NewPass12345");

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid token");
    expect(onDone).not.toHaveBeenCalled();
  });

  it("handsControlBack_whenTheResetSucceeds", async () => {
    const user = userEvent.setup();
    stubApi();
    const { onDone } = renderForm();

    await fillAndSubmit(user, "NewPass12345", "NewPass12345");

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
  });
});
