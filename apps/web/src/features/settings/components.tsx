import { IconUsers } from "@tabler/icons-react";
import type { FormEventHandler } from "react";
import type { OrganizationMember } from "@/lib/api";
import type { OrganizationForm } from "./hooks";

export function OrganizationSettingsPage({
  state,
}: {
  state: ReturnType<typeof import("./hooks").useOrganizationSettings>;
}) {
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

function OrganizationProfile({ form, saving, onChange, onSubmit }: {
  form: OrganizationForm;
  saving: boolean;
  onChange: (form: OrganizationForm) => void;
  onSubmit: FormEventHandler;
}) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-medium">Organization</h2>
      <p className="mt-1 text-sm text-muted-foreground">Update the organization profile used across Teamlyf.</p>
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <Field label="Name" value={form.name} onChange={(value) => onChange({ ...form, name: value })} />
        <Field label="Logo URL" value={form.logo} onChange={(value) => onChange({ ...form, logo: value })} />
        <button disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">{saving ? "Saving..." : "Save changes"}</button>
      </form>
    </section>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block text-sm font-medium">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 block w-full rounded-md border bg-background px-3 py-2 font-normal" /></label>;
}

function MemberManagement({
  members, inviteEmail, inviteRole, busyMember, onInviteEmailChange, onInviteRoleChange, onInvite, onRoleChange, onRemove,
}: {
  members: OrganizationMember[];
  inviteEmail: string;
  inviteRole: string;
  busyMember: string | null;
  onInviteEmailChange: (value: string) => void;
  onInviteRoleChange: (value: string) => void;
  onInvite: React.FormEventHandler;
  onRoleChange: (memberId: string, role: string) => void;
  onRemove: (memberId: string) => void;
}) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="flex items-start gap-3"><IconUsers className="mt-0.5 size-5" /><div><h2 className="font-medium">Members</h2><p className="mt-1 text-sm text-muted-foreground">Invite members and manage their existing organization roles.</p></div></div>
      <form onSubmit={onInvite} className="mt-5 flex flex-col gap-2 sm:flex-row">
        <input value={inviteEmail} onChange={(event) => onInviteEmailChange(event.target.value)} type="email" placeholder="member@example.com" required className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm" />
        <select value={inviteRole} onChange={(event) => onInviteRoleChange(event.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm"><option value="member">Member</option><option value="admin">Admin</option></select>
        <button disabled={busyMember === "invite"} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">{busyMember === "invite" ? "Inviting..." : "Invite"}</button>
      </form>
      <div className="mt-5 divide-y">
        {members.map((member) => <MemberRow key={member.id} member={member} busy={busyMember === member.id} onRoleChange={onRoleChange} onRemove={onRemove} />)}
        {!members.length && <p className="py-6 text-sm text-muted-foreground">No members found.</p>}
      </div>
    </section>
  );
}

function MemberRow({ member, busy, onRoleChange, onRemove }: { member: OrganizationMember; busy: boolean; onRoleChange: (memberId: string, role: string) => void; onRemove: (memberId: string) => void }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium">{member.user?.name ?? member.user?.email ?? member.id}</p><p className="text-xs text-muted-foreground">{member.user?.email ?? "Organization member"}</p></div><div className="flex items-center gap-2"><select value={member.role} disabled={busy} onChange={(event) => onRoleChange(member.id, event.target.value)} className="rounded-md border bg-background px-2 py-1.5 text-sm"><option value="member">Member</option><option value="admin">Admin</option><option value="owner">Owner</option></select><button disabled={busy} onClick={() => onRemove(member.id)} className="rounded-md border px-3 py-1.5 text-sm text-destructive disabled:opacity-50">{busy ? "Saving..." : "Remove"}</button></div></div>;
}
