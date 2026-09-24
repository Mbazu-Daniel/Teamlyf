import { useEffect, useState, type FormEvent } from "react";
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

  useEffect(() => {
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
    await runAction(() => settingsApi.updateOrganization(organization.id, { name: form.name.trim(), logo: form.logo.trim() || undefined }), selectOrganization, "Unable to update organization", setSaving, setError);
  }

  async function inviteMember(event: FormEvent) {
    event.preventDefault();
    if (!organization || !inviteEmail.trim()) return;
    await runAction(() => settingsApi.inviteMember(organization.id, { email: inviteEmail.trim(), role: inviteRole }), () => setInviteEmail(""), "Unable to invite member", (busy) => setBusyMember(busy ? "invite" : null), setError);
  }

  async function updateRole(memberId: string, role: string) {
    if (!organization) return;
    await runAction(
      () => settingsApi.updateMemberRole(organization.id, memberId, role),
      () => setMembers((current) => current.map((member) => member.id === memberId ? { ...member, role } : member)),
      "Unable to update member role",
      (busy) => setBusyMember(busy ? memberId : null),
      setError,
    );
  }

  async function removeMember(memberId: string) {
    if (!organization || !window.confirm("Remove this member from the organization?")) return;
    await runAction(() => settingsApi.removeMember(organization.id, memberId), () => setMembers((current) => current.filter((member) => member.id !== memberId)), "Unable to remove member", (busy) => setBusyMember(busy ? memberId : null), setError);
  }

  return { form, members, loadingMembers, inviteEmail, inviteRole, saving, busyMember, error, setForm, setInviteEmail, setInviteRole, saveOrganization, inviteMember, updateRole, removeMember };
}

async function runAction<T>(action: () => Promise<T>, onSuccess: (value: T) => void | Promise<void>, fallback: string, setBusy: (busy: boolean) => void, setError: (error: string | null) => void) {
  setBusy(true);
  setError(null);
  try { await onSuccess(await action()); } catch (err) { setError(getErrorMessage(err, fallback)); } finally { setBusy(false); }
}

function getErrorMessage(error: unknown, fallback: string) { return error instanceof Error ? error.message : fallback; }
