import { useState, type FormEvent } from "react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { IconCalendar, IconPlus, IconUsers } from "@tabler/icons-react";
import { PageHeader } from "@/components/page-header";
import { Avatar, Metric, StatusPill } from "@/components/workspace-ui";
import { AppDialog } from "@/components/app-dialog";
import { ResourceState } from "@/components/resource-state";
import { api, organizationPath, useApiResource } from "@/lib/api";

type Employee = {
  id: string;
  name: string;
  email: string;
  jobTitle: string | null;
  status: string;
  managerId: string | null;
};
type Leave = {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: string;
};
export const Route = createFileRoute("/$tenant/hr")({ component: People });
function People() {
  const { tenant } = useParams({ strict: false }) as { tenant: string };
  const employees = useApiResource<Employee[]>(
    organizationPath(tenant, "/hr/employees"),
  );
  const leave = useApiResource<Leave[]>(
    organizationPath(tenant, "/hr/leave-requests"),
  );
  const invitations = useApiResource<Array<{ id: string; email: string; role: string; status: string }>>(organizationPath(tenant, "/invitations"));
  const [modal, setModal] = useState<"invite" | "employee" | "leave" | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const employeeById = new Map(
    (employees.data ?? []).map((employee) => [employee.id, employee]),
  );
  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await api(organizationPath(tenant, "/invitations"), {
        method: "POST",
        body: JSON.stringify({
          email: String(form.get("email")),
          role: [String(form.get("role"))],
        }),
      });
      setMessage("Invitation sent.");
      setModal(null);
    } catch (reason) {
      setMessage(
        reason instanceof Error ? reason.message : "Unable to send invite",
      );
    } finally {
      setBusy(false);
    }
  }
  async function createEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await api(organizationPath(tenant, "/hr/employees"), {
        method: "POST",
        body: JSON.stringify({
          name: String(form.get("name")),
          email: String(form.get("email")),
          jobTitle: String(form.get("jobTitle") || ""),
          managerId: String(form.get("managerId") || undefined),
        }),
      });
      setModal(null);
      await employees.reload();
    } catch (reason) {
      setMessage(
        reason instanceof Error ? reason.message : "Unable to create profile",
      );
    } finally {
      setBusy(false);
    }
  }
  async function requestLeave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await api(organizationPath(tenant, "/hr/leave-requests"), {
        method: "POST",
        body: JSON.stringify({
          employeeId: String(form.get("employeeId")),
          startDate: String(form.get("startDate")),
          endDate: String(form.get("endDate")),
          reason: String(form.get("reason") || ""),
        }),
      });
      setModal(null);
      await leave.reload();
    } catch (reason) {
      setMessage(
        reason instanceof Error ? reason.message : "Unable to request leave",
      );
    } finally {
      setBusy(false);
    }
  }
  async function review(item: Leave, status: "approved" | "rejected") {
    try {
      await api(organizationPath(tenant, `/hr/leave-requests/${item.id}`), {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await leave.reload();
    } catch (reason) {
      setMessage(
        reason instanceof Error ? reason.message : "Unable to review leave",
      );
    }
  }
  return (
    <>
      <PageHeader
        title="People"
        description="Invite colleagues, maintain employee profiles, map reporting lines, and manage time away."
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setModal("employee")}
              className="h-9 rounded-xl border bg-white px-3 text-sm font-semibold"
            >
              Add profile
            </button>
            <button
              onClick={() => setModal("invite")}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-violet-600 px-3 text-sm font-semibold text-white"
            >
              <IconPlus className="size-4" />
              Invite teammate
            </button>
          </div>
        }
      />
      <section className="grid gap-4 sm:grid-cols-3">
        <Metric
          label="People"
          value={String(employees.data?.length ?? 0)}
          trend="Employee profiles"
        />
        <Metric
          label="Pending time away"
          value={String(
            (leave.data ?? []).filter((item) => item.status === "pending")
              .length,
          )}
          trend="Requires review"
        />
        <Metric
          label="Active"
          value={String(
            (employees.data ?? []).filter((item) => item.status === "active")
              .length,
          )}
          trend="In the org chart"
        />
      </section>
      <section className="mt-6 grid gap-5 xl:grid-cols-[1fr_21rem]">
        <ResourceState
          loading={employees.loading}
          error={employees.error}
          onRetry={employees.reload}
          isEmpty={employees.data?.length === 0}
          emptyTitle="Build your people directory"
          emptyCopy="Add an employee profile or invite a teammate to get started."
        >
          {employees.data && (
            <div className="surface overflow-hidden rounded-2xl">
              <div className="flex items-center justify-between border-b p-5">
                <div>
                  <h2 className="font-semibold">Directory & org chart</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Reporting lines are shown below each profile.
                  </p>
                </div>
                <IconUsers className="size-5 text-violet-600" />
              </div>
              <div className="divide-y">
                {employees.data.map((employee) => (
                  <article
                    key={employee.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-5"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={employee.name} />
                      <div>
                        <p className="text-sm font-semibold">{employee.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {employee.jobTitle || "No role yet"} ·{" "}
                          {employee.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {employee.managerId
                          ? `Reports to ${employeeById.get(employee.managerId)?.name ?? "manager"}`
                          : "Top-level"}
                      </span>
                      <StatusPill
                        tone={employee.status === "active" ? "green" : "amber"}
                      >
                        {employee.status}
                      </StatusPill>
                    </div>
                  </article>
                ))}
              </div>
              <div className="border-t bg-muted/20 p-5"><p className="eyebrow mb-3">Reporting structure</p><div className="flex flex-wrap gap-3">{(employees.data ?? []).filter((employee) => !employee.managerId).map((leader) => <div key={leader.id} className="min-w-48 rounded-xl border bg-white p-3"><p className="text-sm font-semibold">{leader.name}</p><p className="text-xs text-muted-foreground">{leader.jobTitle || "Team lead"}</p><div className="mt-3 border-l-2 border-violet-200 pl-3">{(employees.data ?? []).filter((employee) => employee.managerId === leader.id).map((report) => <p key={report.id} className="py-1 text-xs text-muted-foreground">{report.name}</p>)}{!(employees.data ?? []).some((employee) => employee.managerId === leader.id) && <p className="text-xs text-muted-foreground">No direct reports</p>}</div></div>)}</div></div>
            </div>
          )}
        </ResourceState>
        <aside className="surface rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Time away</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Request and approve leave.
              </p>
            </div>
            <IconCalendar className="size-5 text-violet-600" />
          </div>
          <button
            onClick={() => setModal("leave")}
            className="mt-4 w-full rounded-lg bg-muted px-3 py-2 text-sm font-semibold"
          >
            Request time away
          </button>
          <ResourceState
            loading={leave.loading}
            error={leave.error}
            onRetry={leave.reload}
            isEmpty={leave.data?.length === 0}
            emptyTitle="No leave requests"
          >
            {leave.data && (
              <div className="mt-4 space-y-3">
                {leave.data.map((item) => (
                  <div key={item.id} className="rounded-xl border p-3">
                    <p className="text-sm font-semibold">
                      {employeeById.get(item.employeeId)?.name ?? "Teammate"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(item.startDate).toLocaleDateString()} –{" "}
                      {new Date(item.endDate).toLocaleDateString()}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.reason}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <StatusPill
                        tone={
                          item.status === "approved"
                            ? "green"
                            : item.status === "rejected"
                              ? "slate"
                              : "amber"
                        }
                      >
                        {item.status}
                      </StatusPill>
                      {item.status === "pending" && (
                        <span className="flex gap-2">
                          <button
                            onClick={() => void review(item, "approved")}
                            className="text-xs font-semibold text-emerald-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => void review(item, "rejected")}
                            className="text-xs font-semibold text-rose-700"
                          >
                            Decline
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ResourceState>
        </aside>
      </section>
      <section className="surface mt-6 rounded-2xl p-5"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Invitation management</h2><p className="mt-1 text-sm text-muted-foreground">Track outstanding invitations and their assigned role.</p></div><StatusPill tone="amber">{invitations.data?.length ?? 0} sent</StatusPill></div><ResourceState loading={invitations.loading} error={invitations.error} onRetry={invitations.reload} isEmpty={invitations.data?.length === 0} emptyTitle="No invitations sent">{invitations.data && <div className="mt-4 divide-y rounded-xl border bg-white px-4">{invitations.data.map((invite) => <div key={invite.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-semibold">{invite.email}</p><p className="text-xs text-muted-foreground">Invited as {invite.role}</p></div><StatusPill tone={invite.status === "accepted" ? "green" : "amber"}>{invite.status}</StatusPill></div>)}</div>}</ResourceState></section>
      {message && <p className="mt-4 text-sm text-violet-700">{message}</p>}
      {modal === "invite" && (
        <Dialog title="Invite teammate" onClose={() => setModal(null)}>
          <form onSubmit={invite} className="space-y-4">
            <Input name="email" label="Email" type="email" required />
            <label className="block text-sm font-semibold">
              Role
              <select
                name="role"
                className="mt-1.5 h-10 w-full rounded-xl border px-3 text-sm"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <Submit busy={busy} label="Send invitation" />
          </form>
        </Dialog>
      )}
      {modal === "employee" && (
        <Dialog title="Employee profile" onClose={() => setModal(null)}>
          <form onSubmit={createEmployee} className="space-y-4">
            <Input name="name" label="Full name" required />
            <Input name="email" label="Email" type="email" required />
            <Input name="jobTitle" label="Job title" />
            <label className="block text-sm font-semibold">
              Manager
              <select
                name="managerId"
                className="mt-1.5 h-10 w-full rounded-xl border px-3 text-sm"
              >
                <option value="">No manager</option>
                {employees.data?.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </label>
            <Submit busy={busy} label="Create profile" />
          </form>
        </Dialog>
      )}
      {modal === "leave" && (
        <Dialog title="Request time away" onClose={() => setModal(null)}>
          <form onSubmit={requestLeave} className="space-y-4">
            <label className="block text-sm font-semibold">
              Employee
              <select
                name="employeeId"
                required
                className="mt-1.5 h-10 w-full rounded-xl border px-3 text-sm"
              >
                {employees.data?.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </label>
            <Input name="startDate" label="Start date" type="date" required />
            <Input name="endDate" label="End date" type="date" required />
            <Input name="reason" label="Reason" />
            <Submit busy={busy} label="Submit request" />
          </form>
        </Dialog>
      )}
    </>
  );
}
function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <AppDialog title={title} onClose={onClose}>
      {children}
    </AppDialog>
  );
}
function Input({
  name,
  label,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        className="mt-1.5 h-10 w-full rounded-xl border px-3 text-sm"
      />
    </label>
  );
}
function Submit({ busy, label }: { busy: boolean; label: string }) {
  return (
    <button
      disabled={busy}
      className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
    >
      {busy ? "Saving…" : label}
    </button>
  );
}
