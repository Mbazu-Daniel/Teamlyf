import { ImageUpload } from "@/components/workspace/image-upload";
import { IconUsers } from "@tabler/icons-react";
import { createContext, useContext, useState, type FormEventHandler } from "react";
import { pageInput, pageSecondaryAction } from "@/components/workspace/page-layout";
const RoleChoices = createContext<string[]>(["member", "admin", "owner"]);
import type { OrganizationMember } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { OrganizationForm } from "./hooks";

type OrganizationSettingsState = ReturnType<typeof import("./hooks").useOrganizationSettings>;

export function OrganizationSettingsPage({ state, roles = [] }: { state: OrganizationSettingsState; roles?: string[] }) {
  return <RoleChoices value={[...new Set(["member", "admin", "owner", ...roles])]}><div className="space-y-6"><OrganizationProfile form={state.form} saving={state.saving} onChange={state.setForm} onSubmit={state.saveOrganization} /><MemberManagement members={state.members} loadingMembers={state.loadingMembers} inviteEmail={state.inviteEmail} inviteRole={state.inviteRole} busyMember={state.busyMember} onInviteEmailChange={state.setInviteEmail} onInviteRoleChange={state.setInviteRole} onInvite={state.inviteMember} onRoleChange={state.updateRole} onRemove={state.removeMember} />{state.error && <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{state.error}</p>}</div></RoleChoices>;
}

function OrganizationProfile({ form, saving, onChange, onSubmit }: { form: OrganizationForm; saving: boolean; onChange: (form: OrganizationForm) => void; onSubmit: FormEventHandler }) {
  return <section className="rounded-[16px] border border-border/70 bg-card p-5 sm:p-6"><h2 className="text-sm font-semibold">Organization</h2><p className="mt-1 text-sm text-muted-foreground">Update the organization profile used across Teamlyf.</p><form onSubmit={onSubmit} className="mt-5 space-y-4"><Field label="Name" value={form.name} onChange={(value) => onChange({ ...form, name: value })} /><ImageUpload label="Workspace logo" value={form.logo} onChange={(value) => onChange({ ...form, logo: value })} /><button disabled={saving} className="h-control rounded-[12px] bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">{saving ? "Saving..." : "Save changes"}</button></form></section>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block text-sm font-medium">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 block h-control w-full rounded-[12px] border border-border/80 bg-muted/30 px-4 text-sm font-normal outline-none transition-colors focus:border-primary/50 focus:bg-card focus:ring-2 focus:ring-primary/10" /></label>;
}

function MemberManagement({ members, loadingMembers, inviteEmail, inviteRole, busyMember, onInviteEmailChange, onInviteRoleChange, onInvite, onRoleChange, onRemove }: { members: OrganizationMember[]; loadingMembers: boolean; inviteEmail: string; inviteRole: string; busyMember: string | null; onInviteEmailChange: (value: string) => void; onInviteRoleChange: (value: string) => void; onInvite: FormEventHandler; onRoleChange: (memberId: string, role: string) => void; onRemove: (memberId: string) => void }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(0);
  const roles = useContext(RoleChoices);
  const filtered = members.filter((m) => (roleFilter === "all" || m.role.split(",").includes(roleFilter)) && `${m.user?.name} ${m.user?.email}`.toLowerCase().includes(search.toLowerCase()));
  const lastPage = Math.max(0, Math.ceil(filtered.length / 10) - 1);
  const currentPage = Math.min(page, lastPage);
  return <section className="rounded-[16px] border border-border/70 bg-card p-5 sm:p-6"><div className="flex items-start gap-3"><IconUsers className="mt-0.5 size-5" /><div><h2 className="text-sm font-semibold">Members</h2><p className="mt-1 text-sm text-muted-foreground">Invite members and manage their existing organization roles.</p></div></div><MemberInviteForm email={inviteEmail} role={inviteRole} busy={busyMember === "invite"} onEmailChange={onInviteEmailChange} onRoleChange={onInviteRoleChange} onInvite={onInvite} /><div className="mt-5 flex flex-wrap gap-3"><input aria-label="Search members" className={`${pageInput} max-w-sm`} placeholder="Search name or email" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} /><Select value={roleFilter} onValueChange={(value) => { setRoleFilter(value); setPage(0); }} items={Object.fromEntries(["all", ...roles].map((r) => [r, r === "all" ? "All roles" : r]))}><SelectTrigger aria-label="Filter members by role" className="w-auto"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All roles</SelectItem>{roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div><div className="mt-5 divide-y"><MemberListState loadingMembers={loadingMembers} members={filtered.slice(currentPage * 10, (currentPage + 1) * 10)} busyMember={busyMember} onRoleChange={onRoleChange} onRemove={onRemove} /></div><div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground"><span>{filtered.length} members · Page {currentPage + 1} of {lastPage + 1}</span><div className="flex gap-2"><button className={pageSecondaryAction} disabled={!currentPage} onClick={() => setPage(currentPage - 1)}>Previous</button><button className={pageSecondaryAction} disabled={currentPage >= lastPage} onClick={() => setPage(currentPage + 1)}>Next</button></div></div></section>;
}

function MemberListState({ loadingMembers, members, busyMember, onRoleChange, onRemove }: { loadingMembers: boolean; members: OrganizationMember[]; busyMember: string | null; onRoleChange: (memberId: string, role: string) => void; onRemove: (memberId: string) => void }) {
  if (loadingMembers) return <p className="py-6 text-sm text-muted-foreground">Loading members...</p>;
  if (!members.length) return <p className="py-6 text-sm text-muted-foreground">No members found.</p>;
  return <MemberList members={members} busyMember={busyMember} onRoleChange={onRoleChange} onRemove={onRemove} />;
}

function MemberInviteForm({ email, role, busy, onEmailChange, onRoleChange, onInvite }: { email: string; role: string; busy: boolean; onEmailChange: (value: string) => void; onRoleChange: (value: string) => void; onInvite: FormEventHandler }) {
  const roles = useContext(RoleChoices).filter((r) => r !== "owner");
  return <form onSubmit={onInvite} className="mt-5 flex flex-col gap-2 sm:flex-row"><input value={email} onChange={(event) => onEmailChange(event.target.value)} type="email" placeholder="member@example.com" required className="h-control min-w-0 flex-1 rounded-[12px] border border-border/80 bg-muted/30 px-4 text-sm outline-none focus:border-primary/50" /><Select value={role} items={Object.fromEntries(roles.map((r) => [r, r]))} onValueChange={onRoleChange}><SelectTrigger aria-label="Role to invite" className="w-auto"><SelectValue /></SelectTrigger><SelectContent>{roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select><button disabled={busy} className="h-control rounded-[12px] bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">{busy ? "Inviting..." : "Invite"}</button></form>;
}

function MemberList({ members, busyMember, onRoleChange, onRemove }: { members: OrganizationMember[]; busyMember: string | null; onRoleChange: (memberId: string, role: string) => void; onRemove: (memberId: string) => void }) {
  return <>{members.map((member) => <MemberRow key={member.id} member={member} busy={busyMember === member.id} onRoleChange={onRoleChange} onRemove={onRemove} />)}</>;
}

function MemberRow({ member, busy, onRoleChange, onRemove }: { member: OrganizationMember; busy: boolean; onRoleChange: (memberId: string, role: string) => void; onRemove: (memberId: string) => void }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 py-3"><MemberIdentity member={member} /><MemberActions member={member} busy={busy} onRoleChange={onRoleChange} onRemove={onRemove} /></div>;
}

function memberDisplayName(member: OrganizationMember) {
  return member.user?.name ?? member.id;
}

function memberDisplayEmail(member: OrganizationMember) {
  return member.user?.email ?? "Organization member";
}

function MemberIdentity({ member }: { member: OrganizationMember }) {
  return <div><p className="text-sm font-medium">{memberDisplayName(member)}</p><p className="text-xs text-muted-foreground">{memberDisplayEmail(member)}</p></div>;
}

function MemberActions({ member, busy, onRoleChange, onRemove }: { member: OrganizationMember; busy: boolean; onRoleChange: (memberId: string, role: string) => void; onRemove: (memberId: string) => void }) {
  const roles = [...new Set([...useContext(RoleChoices), member.role])];
  return <div className="flex items-center gap-2"><Select value={member.role} items={Object.fromEntries(roles.map((r) => [r, r]))} onValueChange={(role) => onRoleChange(member.id, role)}><SelectTrigger aria-label={`Role for ${memberDisplayName(member)}`} size="sm" className="w-auto" disabled={busy}><SelectValue /></SelectTrigger><SelectContent>{roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select><RemoveMemberButton member={member} busy={busy} onRemove={onRemove} /></div>;
}

function RemoveMemberButton({ member, busy, onRemove }: { member: OrganizationMember; busy: boolean; onRemove: (memberId: string) => void }) {
  if (member.role === "owner") return null;
  return <ConfirmDialog title="Remove this member?" description={`${memberDisplayName(member)} will lose access to this workspace.`} confirmLabel="Remove" cancelLabel="Keep member" destructive onConfirm={() => onRemove(member.id)} trigger={<Button variant="destructive" size="sm" disabled={busy}>{busy ? "Saving..." : "Remove"}</Button>} />;
}
