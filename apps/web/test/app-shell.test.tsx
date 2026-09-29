import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/app/app-shell";

const state = vi.hoisted(() => ({ mobile: true, pathname: "/test" }));
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => state.mobile }));
vi.mock("@tanstack/react-router", () => ({ useLocation: () => ({ pathname: state.pathname }) }));
vi.mock("@/components/header/app-header", () => ({
  AppHeader: ({ onToggle }: { onToggle: () => void }) => <button onClick={onToggle}>Toggle sidebar</button>,
}));
vi.mock("@/components/sidebar/app-sidebar", () => ({
  AppSidebar: ({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) => <aside><button onClick={onToggle}>{collapsed ? "Expand" : "Collapse"}</button></aside>,
}));
beforeEach(() => { state.mobile = true; state.pathname = "/test"; });

describe("AppShell responsive navigation", () => {
  it("keeps the mobile drawer closed initially", () => {
    render(<AppShell>Page content</AppShell>);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("opens a labelled drawer and closes it with Escape", async () => {
    const user = userEvent.setup();
    render(<AppShell>Page content</AppShell>);
    await user.click(screen.getByRole("button", { name: "Toggle sidebar" }));
    expect(await screen.findByRole("dialog", { name: "Workspace navigation" })).toBeVisible();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("closes the drawer after navigating to another page", async () => {
    const user = userEvent.setup();
    const view = render(<AppShell>Page content</AppShell>);
    await user.click(screen.getByRole("button", { name: "Toggle sidebar" }));
    await screen.findByRole("dialog");
    state.pathname = "/test/projects";
    view.rerender(<AppShell>Projects</AppShell>);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("preserves desktop collapse without opening a drawer", async () => {
    state.mobile = false;
    const user = userEvent.setup();
    render(<AppShell>Page content</AppShell>);
    await user.click(screen.getByRole("button", { name: "Toggle sidebar" }));
    expect(screen.getByRole("button", { name: "Expand" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
