import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentPropsWithRef } from "react";
import type { Organization } from "@/lib/api";
import { OrganizationProvider } from "@/lib/organization";
import { UserFooter } from "@/components/sidebar/user-footer";

const ORG: Organization = { id: "org-a", name: "Acme Inc", slug: "acme" };
const AVATAR = "data:image/webp;base64,UklGRg==";
const ME = { id: "member-1", firstName: "Ada", lastName: "Lovelace", avatar: AVATAR };
/** Account handle from signup, deliberately unlike the workspace name below: the
 *  dropdown must show the member name, never this. */
const ACCOUNT_NAME = "ada_l_1847";
/** Cold-start environment creation can eat the default 1s `findByRole` window. */
const FIND_TIMEOUT = { timeout: 5_000 };

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  request: vi.fn(),
  getOrganizations: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
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

// `useGetCurrentUser` imports the client directly rather than through the barrel.
vi.mock("@/lib/api/client", () => ({
  client: { request: mocks.request },
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
  mocks.request.mockImplementation((path: string) =>
    Promise.resolve(path.includes("/members/me") ? ME : ORG),
  );
  mocks.getOrganizations.mockResolvedValue([ORG]);
  mocks.getSession.mockResolvedValue({
    user: { id: "user-1", name: ACCOUNT_NAME, email: "ada@example.com" },
  });
  mocks.signOut.mockResolvedValue(undefined);
});

describe("UserFooter", () => {
  it("prefersTheWorkspaceMemberName_overTheAccountHandle", async () => {
    renderFooter();

    const trigger = await screen.findByRole("button", { name: /Ada Lovelace/ }, FIND_TIMEOUT);
    // `user.name` is one string shared by every workspace; the member row is
    // the per-workspace identity and is the one people recognise.
    expect(trigger).not.toHaveTextContent(ACCOUNT_NAME);
  });

  it("fallsBackToTheAccountName_whenTheMembershipHasNoNameYet", async () => {
    // Onboarding gate: the member row exists but first/last are still empty.
    mocks.request.mockImplementation((path: string) =>
      Promise.resolve(
        path.includes("/members/me")
          ? { id: "member-1", firstName: "", lastName: "", avatar: AVATAR }
          : ORG,
      ),
    );
    renderFooter();

    const trigger = await screen.findByRole(
      "button",
      { name: new RegExp(ACCOUNT_NAME) },
      FIND_TIMEOUT,
    );
    expect(trigger).toHaveTextContent("ada@example.com");
  });

  it("showsTheSignedInIdentity_whenSessionLoaded_rendersNameAndEmail", async () => {
    renderFooter();

    const trigger = await screen.findByRole("button", { name: /Ada Lovelace/ }, FIND_TIMEOUT);
    expect(trigger).toHaveTextContent("ada@example.com");
  });

  it("rendersTheWorkspaceAvatar_whenMembershipHasOne_showsTheStoredPhoto", async () => {
    const { container } = renderFooter();

    const trigger = await screen.findByRole("button", { name: /Ada Lovelace/ }, FIND_TIMEOUT);
    // The photo comes from `member.avatar`, never from the global user record.
    await waitFor(() => expect(container.querySelector(`img[src="${AVATAR}"]`)).not.toBeNull());
    expect(trigger).toBeInTheDocument();
  });

  it("exposesProfileAndWorkspaceSettings_whenMenuOpened_linksToBoth", async () => {
    const user = userEvent.setup();
    renderFooter();

    await user.click(await screen.findByRole("button", { name: /Ada Lovelace/ }, FIND_TIMEOUT));

    const profile = await screen.findByRole("menuitem", { name: "Profile" });
    expect(profile).toHaveAttribute("href", "/$organizationSlug/settings/profile");

    const settings = await screen.findByRole("menuitem", { name: "Workspace settings" });
    expect(settings).toHaveAttribute("href", "/$organizationSlug/settings");
    expect(screen.getByRole("menuitem", { name: "Log out" })).toBeInTheDocument();
  });

  it("exposesAppearanceInsideTheMenu_whenOpen_rendersTheThemeControls", async () => {
    const user = userEvent.setup();
    renderFooter();

    expect(screen.queryByRole("button", { name: "Change appearance" })).not.toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: /Ada Lovelace/ }, FIND_TIMEOUT));

    expect(await screen.findByText("Appearance")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Light" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dark" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "System" })).toBeInTheDocument();
    expect(screen.getByLabelText("Custom accent color")).toBeInTheDocument();
  });

  it("forgetsSessionAndWorkspace_whenLogOutChosen_signsOutAndLeaves", async () => {
    const user = userEvent.setup();
    renderFooter();

    await user.click(await screen.findByRole("button", { name: /Ada Lovelace/ }, FIND_TIMEOUT));
    await user.click(await screen.findByRole("menuitem", { name: "Log out" }));

    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith({ to: "/sign-in" }));
    expect(mocks.signOut).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("teamlyf:last-organization-id:user-1")).toBe(ORG.id);
  });
});
