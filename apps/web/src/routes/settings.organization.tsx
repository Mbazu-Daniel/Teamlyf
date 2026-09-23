import { createFileRoute } from "@tanstack/react-router";
import { IconUsers } from "@tabler/icons-react";
import { useEffect, useState, type FormEvent } from "react";
import { settingsApi, type Organization } from "@/lib/api";
import { useOrganization } from "@/lib/organization";

type Member = {
  id: string;
  role: string;
  user?: { name?: string | null; email?: string | null };
};

type MemberResponse = { members: Member[]; total: number };
type OrganizationForm = { name: string; logo: string };

export const Route = createFileRoute("/settings/organization")({ component: OrganizationSettings });

function OrganizationSettings() {
  const { organization, selectOrganization } = useOrganization();
  const state = useOrganizationSettings(organization, selectOrganization);

  if (!organization) return <EmptyState text="Select an organization before opening settings." />;

  return (
    <div className="space-y-6">
      <OrganizationProfile form={state.form} saving={state.saving} onChange={state.setForm} onSubmit={state.saveOrganization} />
      <MemberManagement
        members={state.members}
        inviteEmail={state.inviteEmail}
        inviteRole={state.inviteRole}
        busyMember={state.busyMember}
        onInviteEmailChange={state.setInviteEmail}
        onInviteRoleChange={state.setInviteRole}
        onInvite={state.inviteMember}
        onRoleChange={state.updateRole}
        onRemove={state.removeMember}
      />
      {state.error && <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{state.error}</p>}
    </div>
  );
}

function useOrganizationSettings(
  organization: Organization | null,
  selectOrganization: (organization: Organization) => void,
) {
  const [form, setForm] = useState<OrganizationForm>({ name: "", logo: "" });
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [saving, setSaving] = useState(false);
  const [busyMember, setBusyMember] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organization) return;
    setForm({ name: organization.name, logo: "" });
    setError(null);
    let active = true;
    void settingsApi.members(organization.id)
      .then((data) => {
        if (active) setMembers(data.members ?? []);
      })
      .catch((err: unknown) => {
        if (active) setError(getErrorMessage(err, "Unable to load members"));
      });
    return () => {
      active = false;
    };
  }, [organization?.id]);

  async function saveOrganization(event: FormEvent) {
    event.preventDefault();
    if (!organization || !form.name.trim()) return;
    await runAction(
      () => settingsApi.updateOrganization(organization.id, { name: form.name.trim(), logo: form.logo.trim() || undefined }),
      (updated) => selectOrganization(updated),
      "Unable to update organization",
      setSaving,
      setError,
    );
  }

  async function inviteMember(event: FormEvent) {
    event.preventDefault();
    if (!organization || !inviteEmail.trim()) return;
    await runAction(
      () => settingsApi.inviteMember(organization.id, { email: inviteEmail.trim(), role: inviteRole }),
      () => setInviteEmail(""),
      "Unable to invite member",
      (value) => setBusyMember(value ? "invite" : null),
      setError,
    );
  }

  async function updateRole(memberId: string, role: string) {
    if (!organization) return;
    await runAction(
      () => settingsApi.updateMemberRole(organization.id, memberId, role),
      async () => {
        const data = await settingsApi.members(organization.id);
        setMembers(data.members ?? []);
      },
      "Unable to update member role",
      (value) => setBusyMember(value ? memberId : null),
      setError,
    );
  }

  async function removeMember(memberId: string) {
    if (!organization || !window.confirm("Remove this member from the organization?")) return;
    await runAction(
      () => settingsApi.removeMember(organization.id, memberId),
      () => setMembers((current) => current.filter((member) => member.id !== memberId)),
      "Unable to remove member",
      (value) => setBusyMember(value ? memberId : null),
      setError,
    );
  }

  return {
    form,
    members,
    inviteEmail,
    inviteRole,
    saving,
    busyMember,
    error,
    setForm,
    setInviteEmail,
    setInviteRole,
    saveOrganization,
    inviteMember,
    updateRole,
    removeMember,
  };
}

async function runAction<T>(
  action: () => Promise<T>,
  onSuccess: (value: T) => void | Promise<void>,
  fallback: string,
  setBusy: (busy: boolean) => void,
  setError: (error: string | null) => void
) {
  setBusy(true);
  setError(null);
  try {
    const value = await action();
    await onSuccess(value);
  } catch (err) {
    setError(getErrorMessage(err, fallback));
  } finally {
    setBusy(false);
  }
}


function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function OrganizationProfile({
  form,
  saving,
  onChange,
  onSubmit,
}: {
  form: OrganizationForm;
  saving: boolean;
  onChange: (form: OrganizationForm) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-medium">Organization</h2>
      <p className="mt-1 text-sm text-muted-foreground">Update the organization profile used across Teamlyf.</p>
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <Field label="Name" value={form.name} onChange={(value) => onChange({ ...form, name: value })} />
        <Field label="Logo URL" value={form.logo} onChange={(value) => onChange({ ...form, logo: value })} />
        <button disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </section>
  );
}

function MemberManagement({
  members,
  inviteEmail,
  inviteRole,
  busyMember,
  onInviteEmailChange,
  onInviteRoleChange,
  onInvite,
  onRoleChange,
  onRemove,
}: {
  members: Member[];
  inviteEmail: string;
  inviteRole: string;
  busyMember: string | null;
  onInviteEmailChange: (value: string) => void;
  onInviteRoleChange: (value: string) => void;
  onInvite: (event: FormEvent) => void;
  onRoleChange: (memberId: string, role: string) => void;
  onRemove: (memberId: string) => void;
}) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="flex items-start gap-3"><IconUsers className="mt-0.5 size-5" /><div><h2 className="font-medium">Members</h2><p className="mt-1 text-sm text-muted-foreground">Invite members and manage their existing organization roles.</p></div></div>
      <form onSubmit={onInvite} className="mt-5 flex flex-col gap-2 sm:flex-row">
        <input value={inviteEmail} onChange={(event) => onInviteEmailChange(event.target.value)} type="email" placeholder="member@example.com" required className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm" />
        <select value={inviteRole} onChange={(event) => onInviteRoleChange(event.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm">
          <option value="member">Member</option><option value="admin">Admin</option>
        </select>
        <button disabled={busyMember === "invite"} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">{busyMember === "invite" ? "Inviting..." : "Invite"}</button>
      </form>
      <div className="mt-5 divide-y">
        {members.map((member) => (
          <MemberRow key={member.id} member={member} busy={busyMember === member.id} onRoleChange={onRoleChange} onRemove={onRemove} />
        ))}
        {!members.length && <p className="py-6 text-sm text-muted-foreground">No members found.</p>}
      </div>
    </section>
  );
}

function MemberRow({ member, busy, onRoleChange, onRemove }: { member: Member; busy: boolean; onRoleChange: (memberId: string, role: string) => void; onRemove: (memberId: string) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
      <MemberIdentity member={member} />
      <MemberActions member={member} busy={busy} onRoleChange={onRoleChange} onRemove={onRemove} />
    </div>
  );
}

function MemberIdentity({ member }: { member: Member }) {
  return (
    <div>
      <p className="text-sm font-medium">{memberDisplayName(member)}</p>
      <p className="text-xs text-muted-foreground">{memberEmail(member)}</p>
    </div>
  );
}

function memberDisplayName(member: Member) {
  return [member.user?.name, member.user?.email, member.id].find(Boolean) ?? member.id;
}

function memberEmail(member: Member) {
  return member.user?.email ?? "Organization member";
}

function MemberActions({ member, busy, onRoleChange, onRemove }: { member: Member; busy: boolean; onRoleChange: (memberId: string, role: string) => void; onRemove: (memberId: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <select value={member.role} disabled={busy} onChange={(event) => void onRoleChange(member.id, event.target.value)} className="rounded-md border bg-background px-2 py-1.5 text-sm">
        <option value="member">Member</option><option value="admin">Admin</option><option value="owner">Owner</option>
      </select>
      <RemoveMemberButton member={member} busy={busy} onRemove={onRemove} />
    </div>
  );
}

function RemoveMemberButton({ member, busy, onRemove }: { member: Member; busy: boolean; onRemove: (memberId: string) => void }) {
  if (member.role === "owner") return null;
  return <button disabled={busy} onClick={() => void onRemove(member.id)} className="rounded-md border px-3 py-1.5 text-sm text-destructive hover:bg-muted disabled:opacity-50">Remove</button>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="text-sm font-medium">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" /></label>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">{text}</div>;
}
