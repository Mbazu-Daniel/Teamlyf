import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { client } from "@/lib/api";
import { useOrganization } from "@/lib/organization";

type Profile = {
  id: string;
  employeeNumber: string | null;
  jobTitle: string | null;
  employmentType: string | null;
  status: string | null;
  startDate: string | null;
  phone: string | null;
  address: string | null;
};

type LeaveRequest = {
  id: string;
  policyId: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: string;
};

export const Route = createFileRoute("/hr")({ component: HrPage });

function HrPage() {
  const { organization } = useOrganization();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [leave, setLeave] = useState<LeaveRequest[]>([]);
  const [form, setForm] = useState({
    employeeNumber: "",
    jobTitle: "",
    employmentType: "full_time",
    status: "active",
    startDate: "",
    phone: "",
    address: "",
  });
  const [leaveForm, setLeaveForm] = useState({ policyId: "", startDate: "", endDate: "", reason: "" });
  const [saving, setSaving] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (organization) void load();
  }, [organization?.id]);

  async function load() {
    if (!organization) return;
    setError(null);
    try {
      const [profileData, leaveData] = await Promise.all([
        client.request<Profile | null>(`/organization/${organization.id}/hr/profile`),
        client.request<LeaveRequest[]>(`/organization/${organization.id}/hr/leave`),
      ]);
      setProfile(profileData);
      setLeave(leaveData);
      if (profileData) {
        setForm({
          employeeNumber: profileData.employeeNumber ?? "",
          jobTitle: profileData.jobTitle ?? "",
          employmentType: profileData.employmentType ?? "full_time",
          status: profileData.status ?? "active",
          startDate: profileData.startDate?.slice(0, 10) ?? "",
          phone: profileData.phone ?? "",
          address: profileData.address ?? "",
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load HR information");
    }
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (!organization) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await client.request<Profile>(`/organization/${organization.id}/hr/profile`, {
        method: "PATCH",
        body: JSON.stringify({
          ...form,
          startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
        }),
      });
      setProfile(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save profile");
    } finally {
      setSaving(false);
    }
  }

  async function requestLeave(event: FormEvent) {
    event.preventDefault();
    if (!organization) return;
    setRequesting(true);
    setError(null);
    try {
      const created = await client.request<LeaveRequest>(`/organization/${organization.id}/hr/leave`, {
        method: "POST",
        body: JSON.stringify(leaveForm),
      });
      setLeave((current) => [created, ...current]);
      setLeaveForm({ policyId: "", startDate: "", endDate: "", reason: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to request leave");
    } finally {
      setRequesting(false);
    }
  }

  if (!organization) {
    return <main className="mx-auto max-w-6xl px-6 py-12"><h1 className="text-2xl font-semibold">HR</h1><p className="mt-2 text-muted-foreground">Select an organization first.</p></main>;
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <header>
        <p className="text-sm text-muted-foreground">{organization.name}</p>
        <h1 className="mt-1 text-3xl font-semibold">HR</h1>
        <p className="mt-2 text-sm text-muted-foreground">Manage your employee profile and leave requests.</p>
      </header>
      {error && <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <form onSubmit={saveProfile} className="rounded-xl border bg-card p-5">
          <h2 className="font-medium">Employee profile</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Employee number" value={form.employeeNumber} onChange={(value) => setForm((f) => ({ ...f, employeeNumber: value }))} />
            <Field label="Job title" value={form.jobTitle} onChange={(value) => setForm((f) => ({ ...f, jobTitle: value }))} />
            <Field label="Employment type" value={form.employmentType} onChange={(value) => setForm((f) => ({ ...f, employmentType: value }))} />
            <Field label="Status" value={form.status} onChange={(value) => setForm((f) => ({ ...f, status: value }))} />
            <Field label="Start date" type="date" value={form.startDate} onChange={(value) => setForm((f) => ({ ...f, startDate: value }))} />
            <Field label="Phone" value={form.phone} onChange={(value) => setForm((f) => ({ ...f, phone: value }))} />
            <label className="sm:col-span-2"><span className="text-sm font-medium">Address</span><textarea value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} rows={3} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" /></label>
          </div>
          <div className="mt-5 flex justify-end"><button disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">{saving ? "Saving..." : "Save profile"}</button></div>
          {profile && <p className="mt-3 text-xs text-muted-foreground">Profile saved for this organization.</p>}
        </form>

        <div className="space-y-6">
          <form onSubmit={requestLeave} className="rounded-xl border bg-card p-5">
            <h2 className="font-medium">Request leave</h2>
            <p className="mt-1 text-xs text-muted-foreground">Use the leave policy ID assigned by your organization.</p>
            <div className="mt-4 space-y-3">
              <Field label="Policy ID" value={leaveForm.policyId} onChange={(value) => setLeaveForm((f) => ({ ...f, policyId: value }))} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start date" type="date" value={leaveForm.startDate} onChange={(value) => setLeaveForm((f) => ({ ...f, startDate: value }))} />
                <Field label="End date" type="date" value={leaveForm.endDate} onChange={(value) => setLeaveForm((f) => ({ ...f, endDate: value }))} />
              </div>
              <label><span className="text-sm font-medium">Reason</span><textarea value={leaveForm.reason} onChange={(e) => setLeaveForm((f) => ({ ...f, reason: e.target.value }))} rows={3} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" /></label>
              <button disabled={requesting || !leaveForm.policyId || !leaveForm.startDate || !leaveForm.endDate} className="w-full rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">{requesting ? "Requesting..." : "Request leave"}</button>
            </div>
          </form>

          <section className="rounded-xl border bg-card p-5">
            <h2 className="font-medium">Leave requests</h2>
            <div className="mt-4 divide-y">
              {leave.map((item) => (
                <div key={item.id} className="py-3 first:pt-0">
                  <div className="flex items-center justify-between gap-3"><p className="text-sm font-medium">{item.startDate.slice(0, 10)} to {item.endDate.slice(0, 10)}</p><span className="text-xs capitalize text-muted-foreground">{item.status}</span></div>
                  {item.reason && <p className="mt-1 text-xs text-muted-foreground">{item.reason}</p>}
                </div>
              ))}
              {!leave.length && <p className="py-6 text-sm text-muted-foreground">No leave requests yet.</p>}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label><span className="text-sm font-medium">{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" /></label>;
}
