import { useEffect, useRef, useState, type FormEvent } from "react";
import { settingsApi, type Organization, type OrganizationMember } from "@/lib/api";

export type OrganizationForm = { name: string; logo: string };

export function useOrganizationSettings(organization: Organization | null, selectOrganization: (organization: Organization) => void) {
  const [form, setForm] = useState<OrganizationForm>({ name: "", logo: "" });
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [saving, setSaving] = useState(false);
  const [busyMember, setBusyMember] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selectedOrganizationId = useRef<string | null>(organization?.id ?? null);

  useEffect(() => {
    selectedOrganizationId.current = organization?.id ?? null;
    if (!organization) {
      setForm({ name: "", logo: "" });
      setMembers([]);
      setLoadingMembers(false);
      return;
    }

    setForm({ name: organization.name, logo: "" });
    setMembers([]);
    setLoadingMembers(true);
    setError(null);
    let active = true;
    void settingsApi.members(organization.id)
      .then((data) => { if (active) setMembers(data.members); })
      .catch((err: unknown) => { if (active) setError(getErrorMessage(err, "Unable to load members")); })
      .finally(() => { if (active) setLoadingMembers(false); });

    return () => { active = false; };
  }, [organization?.id]);

  async function saveOrganization(event: FormEvent) {
    event.preventDefault();
    if (!organization || !form.name.trim()) return;
    const organizationId = organization.id;
    await runAction(
      () => settingsApi.updateOrganization(organizationId, { name: form.name.trim(), logo: form.logo.trim() || undefined }),
      (updated) => {
        if (selectedOrganizationId.current === organizationId) selectOrganization(updated);
      },
      "Unable to update organization",
      setSaving,
      setError,
    );
  }

  async function inviteMember(event: FormEvent) {
    event.preventDefault();
    if (!organization || !inviteEmail.trim()) return;
    const organizationId = organization.id;
    await runAction(
      () => settingsApi.inviteMember(organizationId, { email: inviteEmail.trim(), role: inviteRole }),
      () => { if (selectedOrganizationId.current === organizationId) setInviteEmail(""); },
      "Unable to invite member",
      (busy) => setBusyMember(busy ? "invite" : null),
      setError,
    );
  }

  async function updateRole(memberId: string, role: string) {
    if (!organization) return;
    const organizationId = organization.id;
    await runAction(
      () => settingsApi.updateMemberRole(organizationId, memberId, role),
      () => {
        if (selectedOrganizationId.current !== organizationId) return;
        setMembers((current) => current.map((member) => member.id === memberId ? { ...member, role } : member));
      },
      "Unable to update member role",
      (busy) => setBusyMember(busy ? memberId : null),
      setError,
    );
  }

  async function removeMember(memberId: string) {
    // The UI confirms first (ConfirmDialog in components.tsx); this only guards a missing workspace.
    if (!organization) return;
    const organizationId = organization.id;
    await runAction(
      () => settingsApi.removeMember(organizationId, memberId),
      () => {
        if (selectedOrganizationId.current !== organizationId) return;
        setMembers((current) => current.filter((member) => member.id !== memberId));
      }, "Unable to remove member", (busy) => setBusyMember(busy ? memberId : null), setError);
  }

  return { form, members, loadingMembers, inviteEmail, inviteRole, saving, busyMember, error, setForm, setInviteEmail, setInviteRole, saveOrganization, inviteMember, updateRole, removeMember };
}

async function runAction<T>(action: () => Promise<T>, onSuccess: (value: T) => void | Promise<void>, fallback: string, setBusy: (busy: boolean) => void, setError: (error: string | null) => void) {
  setBusy(true);
  setError(null);
  try { await onSuccess(await action()); } catch (err) { setError(getErrorMessage(err, fallback)); } finally { setBusy(false); }
}

function getErrorMessage(error: unknown, fallback: string) { return error instanceof Error ? error.message : fallback; }
