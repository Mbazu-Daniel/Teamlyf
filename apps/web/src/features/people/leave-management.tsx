import { useState } from "react";
import { queryKeys } from "@/lib/queryKeys";
import { useQuery } from "@tanstack/react-query";
import { hrApi, type LeavePolicy, type OrganizationMember } from "@/lib/api";
import { PagePanel, pageInput, pagePrimaryAction, pageSecondaryAction } from "@/components/workspace/page-layout";
import { WorkflowError, WorkflowField, WorkflowSheet, WorkflowSubmit, useWorkflowMutation } from "@/components/workspace/workflow";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function LeaveManagement({ org, members }: { org: string; members: OrganizationMember[] }) {
  const [scope, setScope] = useState("mine");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [review, setReview] = useState<{ id: string; status: "approved" | "rejected" } | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [policy, setPolicy] = useState<LeavePolicy | "new" | null>(null);
  const policies = useQuery({ queryKey: queryKeys.leavePolicies(org), queryFn: () => hrApi.getLeavePolicies(org), retry: false });
  const requests = useQuery({ queryKey: [...queryKeys.leaveRequests(org), scope], queryFn: () => scope === "mine" ? hrApi.getLeaveRequests(org) : hrApi.getReviewQueue(org), retry: false });
  const balances = useQuery({ queryKey: queryKeys.leaveBalances(org), queryFn: () => hrApi.getLeaveBalances(org), retry: false });
  const mutation = useWorkflowMutation([queryKeys.leaveRequests(org), queryKeys.leaveBalances(org), queryKeys.leavePolicies(org)]);
  const rows = requests.data?.filter((r) => (status === "all" || r.status === status) && `${members.find((m) => m.id === r.memberId)?.user?.name} ${policies.data?.find((p) => p.id === r.policyId)?.name} ${r.reason ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  return <>
    <div className="flex flex-wrap gap-3"><button className={pagePrimaryAction} onClick={() => setRequestOpen(true)}>Request leave</button><button className={pageSecondaryAction} onClick={() => setPolicy("new")}>Create leave type</button><select className={`${pageInput} !w-auto`} aria-label="Leave scope" value={scope} onChange={(e) => setScope(e.target.value)}><option value="mine">My requests</option><option value="review">Team review queue</option></select><select aria-label="Leave status" className={`${pageInput} !w-auto`} value={status} onChange={(e) => setStatus(e.target.value)}>{["all", "pending", "approved", "rejected", "cancelled"].map((s) => <option key={s}>{s}</option>)}</select><input aria-label="Search leave" className={`${pageInput} max-w-sm`} placeholder="Search employee or leave type…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
    <WorkflowError error={policies.error || requests.error || balances.error || mutation.error} />
    <div className="grid gap-3 md:grid-cols-3">{balances.data?.map((b) => <PagePanel key={b.policyId}><p className="text-xs text-muted-foreground">{b.policyName}</p><p className="mt-2 text-xl font-semibold">{b.remainingDays} days left</p><p className="text-xs text-muted-foreground">{b.usedDays} used of {b.daysPerYear}</p></PagePanel>)}</div>
    <PagePanel>{requests.isPending ? <p role="status">Loading leave requests…</p> : <><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{["Employee", "Type", "Dates", "Status", "Actions"].map((h) => <th key={h} className="p-3 text-xs text-muted-foreground">{h}</th>)}</tr></thead><tbody>{rows?.map((r) => <tr key={r.id} className="border-t"><td className="p-3">{members.find((m) => m.id === r.memberId)?.user?.name || r.memberId}<p className="mt-1 text-xs text-muted-foreground">{r.reason}</p></td><td className="p-3">{policies.data?.find((p) => p.id === r.policyId)?.name ?? "Leave"}</td><td className="p-3">{r.startDate.slice(0, 10)} — {r.endDate.slice(0, 10)}</td><td className="p-3 capitalize">{r.status}<p className="mt-1 text-xs normal-case text-muted-foreground">{r.reviewReason}</p></td><td className="p-3"><div className="flex gap-2">{scope === "review" && r.status === "pending" && (["approved", "rejected"] as const).map((decision) => <button key={decision} disabled={mutation.isPending} className={pageSecondaryAction} onClick={() => setReview({ id: r.id, status: decision })}>{decision === "approved" ? "Approve" : "Reject"}</button>)}{scope === "mine" && ["pending", "approved"].includes(r.status) && <ConfirmDialog title="Cancel your leave request?" trigger={<button disabled={mutation.isPending} className={pageSecondaryAction}>Cancel</button>} onConfirm={() => mutation.mutate(() => hrApi.cancelLeaveRequest(org, r.id))} />}</div></td></tr>)}</tbody></table></div>{!rows?.length && !requests.error && <p className="p-6 text-center text-sm text-muted-foreground">No requests match this view.</p>}</>}</PagePanel>
    <PagePanel><h2 className="mb-4 text-sm font-semibold">Leave types</h2>{policies.data?.map((p) => <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 border-t py-3"><span className="text-sm">{p.name} · {p.daysPerYear} days/year</span><div className="flex gap-2"><button className={pageSecondaryAction} onClick={() => setPolicy(p)}>Edit</button><ConfirmDialog title={`Delete ${p.name}?`} description="Policies referenced by leave requests cannot be removed." destructive trigger={<button className={pageSecondaryAction} disabled={mutation.isPending}>Delete</button>} onConfirm={() => mutation.mutate(() => hrApi.deletePolicy(org, p.id))} /></div></div>)}</PagePanel>
    {review && <ReviewForm org={org} request={review} onClose={() => setReview(null)} />}
    {requestOpen && <LeaveForm org={org} policies={policies.data ?? []} onClose={() => setRequestOpen(false)} />}
    {policy && <PolicyForm org={org} policy={policy === "new" ? undefined : policy} onClose={() => setPolicy(null)} />}
  </>;
}

function LeaveForm({ org, policies, onClose }: { org: string; policies: LeavePolicy[]; onClose: () => void }) {
  const [start, setStart] = useState("");
  const mutation = useWorkflowMutation([queryKeys.leaveRequests(org)], onClose);
  return <WorkflowSheet title="Request leave" onClose={onClose}><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); const data = new FormData(e.currentTarget); mutation.mutate(() => hrApi.createLeaveRequest(org, { policyId: String(data.get("policyId")), startDate: start, endDate: String(data.get("end")), reason: String(data.get("reason")) })); }}><label className="block text-sm">Leave type<select name="policyId" required className={pageInput}><option value="">Select type…</option>{policies.map((p) => <option value={p.id} key={p.id}>{p.name}</option>)}</select></label><WorkflowField label="Start date" type="date" required value={start} onChange={(e) => setStart(e.target.value)} /><WorkflowField label="End date" type="date" name="end" min={start} required /><WorkflowField label="Reason" name="reason" /><WorkflowError error={mutation.error} /><WorkflowSubmit pending={mutation.isPending} label="Submit request" /></form></WorkflowSheet>;
}

function PolicyForm({ org, policy, onClose }: { org: string; policy?: LeavePolicy; onClose: () => void }) {
  const mutation = useWorkflowMutation([queryKeys.leavePolicies(org), queryKeys.leaveBalances(org)], onClose);
  return <WorkflowSheet title={policy ? "Edit leave type" : "Create leave type"} onClose={onClose}><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); const data = new FormData(e.currentTarget); const input = { name: String(data.get("name")).trim(), daysPerYear: Number(data.get("days")) }; mutation.mutate(() => policy ? hrApi.updatePolicy(org, policy.id, input) : hrApi.createPolicy(org, input)); }}><WorkflowField label="Name" name="name" required defaultValue={policy?.name} /><WorkflowField label="Days per year" name="days" type="number" min={0} step={1} required defaultValue={policy?.daysPerYear ?? 20} /><WorkflowError error={mutation.error} /><WorkflowSubmit pending={mutation.isPending} /></form></WorkflowSheet>;
}

function ReviewForm({ org, request, onClose }: { org: string; request: { id: string; status: "approved" | "rejected" }; onClose: () => void }) {
  const mutation = useWorkflowMutation([queryKeys.leaveRequests(org), queryKeys.leaveBalances(org)], onClose);
  return <WorkflowSheet title={request.status === "approved" ? "Approve leave" : "Reject leave"} onClose={onClose}><form className="space-y-5" onSubmit={(event) => { event.preventDefault(); const reason = String(new FormData(event.currentTarget).get("reason")).trim(); mutation.mutate(() => hrApi.reviewLeaveRequest(org, request.id, request.status, reason)); }}><label className="block space-y-2 text-sm"><span>{request.status === "rejected" ? "Reason for rejection" : "Review note (optional)"}</span><textarea name="reason" required={request.status === "rejected"} maxLength={2000} rows={5} className={`${pageInput} !h-auto py-3`} /></label><WorkflowError error={mutation.error} /><WorkflowSubmit pending={mutation.isPending} label="Confirm decision" /></form></WorkflowSheet>;
}
