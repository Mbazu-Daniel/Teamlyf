import { Link } from "@tanstack/react-router";
import { IconUsers } from "@tabler/icons-react";
import type { LeaveBalance, LeaveRequest } from "@/lib/api";
import { DashboardPanel } from "./dashboard-panel";
import type { TeamSummary } from "./dashboard-metrics";

/**
 * The team's shape from HR data: who is in the workspace, how they are grouped,
 * and what time off is waiting. HR endpoints are permission-gated, so a viewer
 * sees the member count and a quiet note instead of an error.
 */
export function DashboardTeam({
  organizationSlug,
  summary,
  pendingLeave,
  balances,
  hrDenied,
}: {
  organizationSlug: string;
  summary: TeamSummary;
  pendingLeave: readonly LeaveRequest[];
  balances: readonly LeaveBalance[];
  hrDenied: boolean;
}) {
  const approvedDays = balances.filter((balance) => balance.status === "approved");
  const remaining = approvedDays.length
    ? Math.round(approvedDays.reduce((sum, balance) => sum + balance.remainingDays, 0) / approvedDays.length)
    : 0;

  return (
    <DashboardPanel
      title="Team"
      description="Directory, departments and time off."
      action={
        <Link
          to="/$organizationSlug/hr"
          params={{ organizationSlug }}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Open HR
        </Link>
      }
    >
      {summary.peopleCount === 0 ? (
        <div className="flex flex-col items-center px-6 py-10 text-center">
          <IconUsers className="size-5 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium">No team members yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Invite people to staff projects and departments.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums tracking-[-0.03em]">{summary.peopleCount}</span>
            <span className="text-sm text-muted-foreground">
              {summary.departments.length === 1 ? "1 department" : `${summary.departments.length} departments`}
            </span>
          </div>

          {summary.departments.length > 0 ? (
            <ul className="space-y-2">
              {summary.departments.slice(0, 4).map((department) => (
                <li key={department.id} className="flex items-center gap-2.5 text-sm">
                  <span className="size-2 shrink-0 rounded-full bg-primary/60" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{department.name}</span>
                  <span className="tabular-nums text-muted-foreground">{department.size}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {summary.unassignedCount > 0 ? (
            <p className="text-sm text-muted-foreground">
              {summary.unassignedCount} {summary.unassignedCount === 1 ? "person has" : "people have"} no department.
            </p>
          ) : null}

          <div className="rounded-lg border border-border/60 px-3 py-2.5">
            <p className="text-xs text-muted-foreground">Time off</p>
            <p className="mt-1 text-sm">
              {pendingLeave.length === 0
                ? "No requests waiting for approval."
                : `${pendingLeave.length} request${pendingLeave.length === 1 ? "" : "s"} waiting for approval.`}
            </p>
            {approvedDays.length > 0 ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {remaining} days remaining on approved balances.
              </p>
            ) : null}
            {hrDenied ? (
              <p className="mt-1 text-xs text-muted-foreground">Leave data needs HR access.</p>
            ) : null}
          </div>
        </div>
      )}
    </DashboardPanel>
  );
}
