import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { OrganizationMember } from "@/lib/api";
import { OrganizationSettingsPage } from "@/features/settings/components";

type SettingsState = ReturnType<typeof import("@/features/settings/hooks").useOrganizationSettings>;

const member: OrganizationMember = {
  id: "member-1",
  userId: "user-1",
  role: "admin",
  user: { name: "Ada Lovelace", email: "ada@example.com" },
};

function buildState(removeMember: SettingsState["removeMember"]): SettingsState {
  return {
    form: { name: "Acme", logo: "" },
    members: [member],
    loadingMembers: false,
    inviteEmail: "",
    inviteRole: "member",
    saving: false,
    busyMember: null,
    error: null,
    setForm: () => {},
    setInviteEmail: () => {},
    setInviteRole: () => {},
    saveOrganization: async () => {},
    inviteMember: async () => {},
    updateRole: async () => {},
    removeMember,
  };
}

describe("OrganizationSettingsPage member removal", () => {
  it("asksForConfirmation_whenRemoveClicked_beforeCallingRemove", async () => {
    const user = userEvent.setup();
    const removeMember = vi.fn(async () => {});
    render(<OrganizationSettingsPage state={buildState(removeMember)} />);

    await user.click(screen.getByRole("button", { name: "Remove" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAccessibleName("Remove this member?");
    expect(removeMember).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Remove" }));

    expect(removeMember).toHaveBeenCalledWith("member-1");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keepsRemoveCancelled_whenCancelClicked", async () => {
    const user = userEvent.setup();
    const removeMember = vi.fn(async () => {});
    render(<OrganizationSettingsPage state={buildState(removeMember)} />);

    await user.click(screen.getByRole("button", { name: "Remove" }));
    await user.click(await screen.findByRole("button", { name: "Keep member" }));

    expect(removeMember).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("usesSelectPrimitive_whenRenderingRoles_noNativeSelectLeft", () => {
    const { container } = render(<OrganizationSettingsPage state={buildState(vi.fn(async () => {}))} />);

    expect(container.querySelector("select")).toBeNull();
    expect(screen.getByRole("combobox", { name: "Role to invite" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Role for Ada Lovelace" })).toBeInTheDocument();
  });
});
