import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Organization } from "@/lib/api";
import { OrganizationProvider } from "@/lib/organization";
import { WorkspaceSwitcher } from "@/components/sidebar/workspace-switcher";

const ORG_A: Organization = { id: "org-a", name: "Acme Inc", slug: "acme" };
const ORG_B: Organization = { id: "org-b", name: "Globex", slug: "globex" };

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  pathname: "/projects",
  workspaces: [] as Organization[],
  request: vi.fn(),
  getOrganizations: vi.fn(),
}));

// The shell only runs inside a router and behind the API client; both are
// seams here so the test can drive the pathname and read the switch outcome.
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ pathname: mocks.pathname }),
}));

vi.mock("@/lib/api", () => ({
  client: { request: mocks.request },
  getOrganizations: mocks.getOrganizations,
}));

function renderSwitcher() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <OrganizationProvider>
        <WorkspaceSwitcher collapsed={false} />
      </OrganizationProvider>
    </QueryClientProvider>,
  );
}

async function openSwitcher(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: /Acme Inc/ }));
  await screen.findByRole("menu");
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem("teamlyf:organization-id", ORG_A.id);
  mocks.pathname = "/projects";
  mocks.workspaces = [ORG_A, ORG_B];
  mocks.request.mockResolvedValue(ORG_A);
  mocks.getOrganizations.mockResolvedValue(mocks.workspaces);
});

describe("WorkspaceSwitcher", () => {
  it("listsTheMembersWorkspaces_whenMenuOpened_includingTheCreateAffordance", async () => {
    const user = userEvent.setup();
    renderSwitcher();

    await openSwitcher(user);

    expect(screen.getByRole("menuitem", { name: /Acme Inc/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Globex/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Create workspace" })).toBeInTheDocument();
  });

  it("persistsTheChoice_whenAnotherWorkspacePicked_updatesTheActiveWorkspace", async () => {
    const user = userEvent.setup();
    renderSwitcher();

    await openSwitcher(user);
    await user.click(screen.getByRole("menuitem", { name: /Globex/ }));

    expect(localStorage.getItem("teamlyf:organization-id")).toBe(ORG_B.id);
    expect(await screen.findByRole("button", { name: /Globex/ })).toBeInTheDocument();
  });

  it("reloadsCachedData_whenWorkspaceChosen_refetchesTheWorkspaceList", async () => {
    const user = userEvent.setup();
    renderSwitcher();
    await openSwitcher(user);
    expect(mocks.getOrganizations).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("menuitem", { name: /Globex/ }));

    await waitFor(() => expect(mocks.getOrganizations.mock.calls.length).toBeGreaterThan(1));
  });

  it("returnsToTheSectionRoot_whenSwitchingFromANestedRoute", async () => {
    mocks.pathname = "/projects/proj-1";
    const user = userEvent.setup();
    renderSwitcher();

    await openSwitcher(user);
    await user.click(screen.getByRole("menuitem", { name: /Globex/ }));

    expect(mocks.navigate).toHaveBeenCalledWith({ to: "/projects" });
  });

  it("staysPut_whenTheCurrentRouteStillBelongsToTheNewWorkspace", async () => {
    mocks.pathname = "/settings";
    const user = userEvent.setup();
    renderSwitcher();

    await openSwitcher(user);
    await user.click(screen.getByRole("menuitem", { name: /Globex/ }));

    expect(localStorage.getItem("teamlyf:organization-id")).toBe(ORG_B.id);
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("opensTheWorkspacePicker_whenCreateWorkspaceChosen", async () => {
    const user = userEvent.setup();
    renderSwitcher();

    await openSwitcher(user);
    await user.click(screen.getByRole("menuitem", { name: "Create workspace" }));

    expect(mocks.navigate).toHaveBeenCalledWith({ to: "/workspaces" });
  });
});
