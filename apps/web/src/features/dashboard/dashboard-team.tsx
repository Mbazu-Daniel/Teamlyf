import { Link } from "@tanstack/react-router";
import { DashboardPanel } from "./dashboard-panel";
import type { DashboardState } from "./use-dashboard";

export function DashboardTeam({
  organizationSlug,
  team,
  leave,
}: {
  organizationSlug: string;
  team: DashboardState["team"];
  leave: DashboardState["leave"];
}) {
  return (
    <DashboardPanel
      title="People & time away"
      description="Your workspace directory and your leave requests."
      action={
        <Link
          to="/$organizationSlug/people"
          params={{ organizationSlug }}
          className="text-sm text-primary"
        >
          Open HR
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-2xl font-semibold">{team.memberCount}</p>
          <p className="text-xs text-muted-foreground">People</p>
        </div>
        <div>
          <p className="text-2xl font-semibold">{team.departmentCount}</p>
          <p className="text-xs text-muted-foreground">Departments</p>
        </div>
        <div>
          <p className="text-2xl font-semibold">{leave.pending}</p>
          <p className="text-xs text-muted-foreground">Your pending leave requests</p>
        </div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        {team.unassignedCount} people without a department · {leave.upcoming} approved requests
      </p>
      {(team.error || leave.error) && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {team.error || leave.error}
        </p>
      )}
    </DashboardPanel>
  );
}
