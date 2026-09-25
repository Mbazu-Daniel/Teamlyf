import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SocialSignIn } from "@/components/auth/social-sign-in";
import { renderComponent } from "./support/render-component";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllGlobals();
});

function stubFetch(response: Response) {
  const fetchMock = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
    Promise.resolve(response),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const NOT_CONFIGURED = /Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET/;

describe("SocialSignIn", () => {
  it("explainsTheMissingCredentials_whenTheProviderIsNotConfigured", async () => {
    const user = userEvent.setup();
    // better-auth only mounts /sign-in/social for providers that have
    // credentials, so an unconfigured Google answers 404 with an empty body.
    stubFetch(new Response("", { status: 404 }));
    renderComponent(<SocialSignIn />);

    await user.click(screen.getByRole("button", { name: /Continue with Google/ }));

    expect(await screen.findByRole("status")).toHaveTextContent(NOT_CONFIGURED);
  });

  it("showsTheApiExplanation_whenTheFailureIsSomethingElse", async () => {
    const user = userEvent.setup();
    stubFetch(
      new Response(JSON.stringify({ message: "Invalid redirect URL" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );
    renderComponent(<SocialSignIn />);

    await user.click(screen.getByRole("button", { name: /Continue with Google/ }));

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("Invalid redirect URL");
    expect(status).not.toHaveTextContent(NOT_CONFIGURED);
  });

  it("asksForANewLinkInstead_whenNoConsentUrlComesBack", async () => {
    const user = userEvent.setup();
    stubFetch(
      new Response(JSON.stringify({ redirect: false }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    renderComponent(<SocialSignIn />);

    await user.click(screen.getByRole("button", { name: /Continue with Google/ }));

    await waitFor(() => expect(screen.getByRole("status")).toBeInTheDocument());
    expect(screen.getByRole("status")).toHaveTextContent(/not configured yet/i);
  });
});
