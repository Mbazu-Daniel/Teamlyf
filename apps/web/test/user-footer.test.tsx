import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentPropsWithRef } from "react";
import type { Organization } from "@/lib/api";
import { OrganizationProvider } from "@/lib/organization";
import { UserFooter } from "@/components/sidebar/user-footer";

const ORG: Organization = { id: "org-a", name: "Acme Inc", slug: "acme" };

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  request: vi.fn(),
  getOrganizations: vi.fn(),
}));

// Router and API are seams here: the test reads the sign-out outcome from the
// navigate/storage mocks instead of booting a real app under them.
vi.mock("@tanstack/react-router", () => ({
  // Base UI merges the menuitem props onto the render element; forward them
  // the way the real Link does, or the role never reaches the DOM.
  Link: ({ to, children, ...rest }: { to: string } & ComponentPropsWithRef<"a">) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  Navigate: () => null,
  useNavigate: () => mocks.navigate,
}));

vi.mock("@/lib/api", () => ({
  client: { request: mocks.request },
  getOrganizations: mocks.getOrganizations,
  getSession: mocks.getSession,
  signOut: mocks.signOut,
}));

function renderFooter() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <OrganizationProvider>
        <UserFooter collapsed={false} />
      </OrganizationProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem("teamlyf:last-organization-id:user-1", ORG.id);
  mocks.request.mockResolvedValue(ORG);
  mocks.getOrganizations.mockResolvedValue([ORG]);
  mocks.getSession.mockResolvedValue({
    user: { id: "user-1", name: "Ada Lovelace", email: "ada@example.com" },
  });
  mocks.signOut.mockResolvedValue(undefined);
});

describe("UserFooter", () => {
  it("showsTheSignedInIdentity_whenSessionLoaded_rendersNameAndEmail", async () => {
    renderFooter();

    const trigger = await screen.findByRole("button", { name: /Ada Lovelace/ });
    expect(trigger).toHaveTextContent("ada@example.com");
  });

  it("exposesSettings_whenMenuOpened_linksToTheSettingsRoute", async () => {
    const user = userEvent.setup();
    renderFooter();

    await user.click(await screen.findByRole("button", { name: /Ada Lovelace/ }));

    const settings = await screen.findByRole("menuitem", { name: "Settings" });
    expect(settings).toHaveAttribute("href", "/settings");
    expect(screen.getByRole("menuitem", { name: "Log out" })).toBeInTheDocument();
  });

  it("forgetsSessionAndWorkspace_whenLogOutChosen_signsOutAndLeaves", async () => {
    const user = userEvent.setup();
    renderFooter();

    await user.click(await screen.findByRole("button", { name: /Ada Lovelace/ }));
    await user.click(await screen.findByRole("menuitem", { name: "Log out" }));

    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith({ to: "/sign-in" }));
    expect(mocks.signOut).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("teamlyf:last-organization-id:user-1")).toBe(ORG.id);
  });
});
