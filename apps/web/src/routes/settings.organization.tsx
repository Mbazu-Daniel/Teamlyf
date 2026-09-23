import { createFileRoute } from "@tanstack/react-router";
import { IconUsers } from "@tabler/icons-react";
import { useEffect, useState, type FormEvent } from "react";
import { client, type Organization } from "@/lib/api";
import { useOrganization } from "@/lib/organization";

type Member = {
  id: string;
  role: string;
  user?: { name?: string | null; email?: string | null };
};

type MemberResponse = { members: Member[]; total: number };

export const Route = createFileRoute("/settings/organization")({ component: OrganizationSettings });

function OrganizationSettings() {
  const { organization, selectOrganization } = useOrganization();
  const [form, setForm] = useState({ name: "", logo: "" });
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [saving, setSaving] = useState(false);
  const [busyMember, setBusyMember] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organization) return;
    setForm({ name: organization.name, logo: "" });
    void loadMembers(organization.id);
  }, [organization?.id]);

  async function loadMembers(orgId: string) {
    try {
      const response = await client.request<MemberResponse>(`/organization/${orgId}/members?limit=100`);
      setMembers(response.members ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load members");
    }
  }

  async function saveOrganization(event: FormEvent) {
    event.preventDefault();
    if (!organization || !form.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await client.request<Organization>(`/organization/${organization.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: form.name.trim(), logo: form.logo.trim() || undefined }),
      });
      selectOrganization(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update organization");
    } finally {
      setSaving(false);
    }
  }

  async function inviteMember(event: FormEvent) {
    event.preventDefault();
    if (!organization || !inviteEmail.trim()) return;
    setBusyMember("invite");
    setError(null);
    try {
      await client.request(`/organization/${organization.id}/invitations`, {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail.trim(), role: [inviteRole] }),
      });
      setInviteEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to invite member");
    } finally {
      setBusyMember(null);
    }
  }

  async function updateRole(memberId: string, role: string) {
    if (!organization) return;
    setBusyMember(memberId);
    setError(null);
    try {
      await client.request(`/organization/${organization.id}/members/update-role`, {
        method: "POST",
        body: JSON.stringify({ memberId, role: [role] }),
      });
      await loadMembers(organization.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update member role");
    } finally {
      setBusyMember(null);
    }
  }

  async function removeMember(memberId: string) {
    if (!organization || !window.confirm("Remove this member from the organization?")) return;
    setBusyMember(memberId);
    setError(null);
    try {
      await client.request(`/organization/${organization.id}/members/remove`, {
        method: "POST",
        body: JSON.stringify({ memberIdOrEmail: memberId }),
      });
      setMembers((current) => current.filter((member) => member.id !== memberId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove member");
    } finally {
      setBusyMember(null);
    }
  }

  if (!organization) return <EmptyState text="Select an organization before opening settings." />;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-medium">Organization</h2>
        <p className="mt-1 text-sm text-muted-foreground">Update the organization profile used across Teamlyf.</p>
        <form onSubmit={saveOrganization} className="mt-5 space-y-4">
          <Field label="Name" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} />
          <Field label="Logo URL" value={form.logo} onChange={(value) => setForm((current) => ({ ...current, logo: value }))} />
          <button disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <div className="flex items-start gap-3"><IconUsers className="mt-0.5 size-5" /><div><h2 className="font-medium">Members</h2><p className="mt-1 text-sm text-muted-foreground">Invite members and manage their existing organization roles.</p></div></div>
        <form onSubmit={inviteMember} className="mt-5 flex flex-col gap-2 sm:flex-row">
          <input value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} type="email" placeholder="member@example.com" required className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm" />
          <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm">
            <option value="member">Member</option><option value="admin">Admin</option>
          </select>
          <button disabled={busyMember === "invite"} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">{busyMember === "invite" ? "Inviting..." : "Invite"}</button>
        </form>
        <div className="mt-5 divide-y">
          {members.map((member) => (
            <div key={member.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div><p className="text-sm font-medium">{member.user?.name || member.user?.email || member.id}</p><p className="text-xs text-muted-foreground">{member.user?.email ?? "Organization member"}</p></div>
              <div className="flex items-center gap-2">
                <select value={member.role} disabled={busyMember === member.id} onChange={(event) => void updateRole(member.id, event.target.value)} className="rounded-md border bg-background px-2 py-1.5 text-sm">
                  <option value="member">Member</option><option value="admin">Admin</option><option value="owner">Owner</option>
                </select>
                {member.role !== "owner" && <button disabled={busyMember === member.id} onClick={() => void removeMember(member.id)} className="rounded-md border px-3 py-1.5 text-sm text-destructive hover:bg-muted disabled:opacity-50">Remove</button>}
              </div>
            </div>
          ))}
          {!members.length && <p className="py-6 text-sm text-muted-foreground">No members found.</p>}
        </div>
      </section>

      {error && <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="text-sm font-medium">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" /></label>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">{text}</div>;
}
