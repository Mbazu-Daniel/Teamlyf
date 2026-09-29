import { useState } from "react";
import { queryKeys } from "@/lib/queryKeys";
import { useQuery } from "@tanstack/react-query";
import { IconLayoutGrid, IconList, IconUsers } from "@tabler/icons-react";
import { hrApi, settingsApi } from "@/lib/api";
import { useOrganization } from "@/lib/organization";
import { PageEmptyState, PageHeader, PagePanel, WorkspacePage, pageInput, pageSecondaryAction } from "@/components/workspace/page-layout";
import { WorkflowError } from "@/components/workspace/workflow";
import { EmployeeProfile } from "./employee-profile";
import { HrmSidebar } from "./hrm-sidebar";
import { OrganizationChart } from "./org-chart";
import { Departments } from "./departments";
import { LeaveManagement } from "./leave-management";

export function PeoplePage({ section, selectedMember, onNavigate }: { section: string; selectedMember?: string; onNavigate: (section: string, member?: string) => void }) {
  const { organization } = useOrganization();
  const org = organization?.id ?? "";
  const [view, setView] = useState<"board" | "list">("board");
  const [search, setSearch] = useState("");
  const members = useQuery({ queryKey: queryKeys.members(org), queryFn: () => settingsApi.members(org), enabled: !!org });
  const profiles = useQuery({ queryKey: queryKeys.memberProfiles(org), queryFn: () => hrApi.getMemberProfiles(org), enabled: !!org, retry: false });
  const rows = (members.data?.members ?? []).filter((m) => `${m.user?.name} ${m.user?.email} ${profiles.data?.find((p) => p.memberId === m.id)?.jobTitle ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  const selected = members.data?.members.find((m) => m.id === selectedMember);
  if (!org) return <p className="p-8">Select a workspace first.</p>;
  return <WorkspacePage>
    <PageHeader title="People" description="Your people, departments, and time away in one place." />
    <HrmSidebar selected={section} onSelect={onNavigate} />
    {section === "employees" && <>
      <PagePanel><div className="flex flex-wrap items-center gap-3"><input aria-label="Search employees" placeholder="Search name, email or job title…" className={`${pageInput} max-w-xl`} value={search} onChange={(e) => setSearch(e.target.value)} /><button className={pageSecondaryAction} aria-label="Board view" aria-pressed={view === "board"} onClick={() => setView("board")}><IconLayoutGrid size={18} /></button><button className={pageSecondaryAction} aria-label="List view" aria-pressed={view === "list"} onClick={() => setView("list")}><IconList size={18} /></button></div></PagePanel>
      <WorkflowError error={members.error || profiles.error} />
      {members.isPending ? <p role="status">Loading employees…</p> : rows.length === 0 ? <PageEmptyState icon={IconUsers} title="No employees found" description="Try another search, or invite members from workspace settings." /> : <div className={view === "board" ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>{rows.map((m) => <button key={m.id} onClick={() => onNavigate("employees", m.id)} className="rounded-2xl border border-border/70 bg-card p-5 text-left transition-colors hover:border-primary/40"><div className="flex items-center gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">{(m.user?.name || m.user?.email || "?").slice(0, 1)}</span><div className="min-w-0"><h2 className="truncate text-sm font-semibold">{m.user?.name || m.user?.email}</h2><p className="truncate text-xs text-muted-foreground">{m.user?.email}</p><p className="mt-2 text-xs">{profiles.data?.find((p) => p.memberId === m.id)?.jobTitle || "Job title not set"} · {m.role}</p></div></div></button>)}</div>}
    </>}
    {section === "org-chart" && <OrganizationChart org={org} name={organization?.name ?? "Workspace"} members={members.data?.members ?? []} onSelect={(id) => onNavigate("employees", id)} />}
    {section === "departments" && <Departments org={org} members={members.data?.members ?? []} />}
    {section === "leave" && <LeaveManagement org={org} members={members.data?.members ?? []} />}
    {selected && <EmployeeProfile key={selected.id} org={org} member={selected} onClose={() => onNavigate("employees")} />}
    {selectedMember && !selected && !members.isPending && <p role="alert">Employee not found in this workspace.</p>}
  </WorkspacePage>;
}
