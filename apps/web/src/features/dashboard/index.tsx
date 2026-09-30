import { Link } from "@tanstack/react-router";
import { IconArrowRight, IconLayoutKanban, IconPlus } from "@tabler/icons-react";
import type { Project } from "@/lib/api";
import { DashboardDistribution } from "./dashboard-distribution";
import { DashboardDueSoon } from "./dashboard-due-soon";
import { DashboardKpiStrip } from "./dashboard-kpi-strip";
import { DashboardProjects } from "./dashboard-projects";
import { DashboardThroughput } from "./dashboard-throughput";
import { DashboardToday } from "./dashboard-today";
import { useDashboard } from "./use-dashboard";
import { DashboardTeam } from "./dashboard-team";
import { DashboardConnected } from "./dashboard-connected";
import { useSession } from "@/lib/session";

export function DashboardPage({
  organizationId,
  organizationName,
  organizationSlug,
  projects,
}: Readonly<{
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  projects: readonly Project[];
}>) {
  const dashboard = useDashboard(organizationId);
  const session = useSession();
  // Prefer the directory record (member.first/last name); the auth `user.name`
  // column is only a fallback for the brief window before member data resolves.
  const memberName = `${dashboard.member?.firstName ?? ""} ${dashboard.member?.lastName ?? ""}`
    .replace(/\s+/g, " ")
    .trim();
  const displayName =
    memberName || session.data?.user?.name?.trim() || organizationName.trim() || "there";
  const activeProjects = projects.filter(
    (project) => !["completed", "cancelled"].includes(project.status ?? "planned"),
  ).length;

  return (
    <main className="mx-auto w-full max-w-[1440px] space-y-4 px-4 py-5 pb-8 sm:px-6 lg:px-8">
      {/* Overview is metrics-first: a quiet greeting, then the KPI row large
          enough to read at a glance. No oversized hero. */}
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 px-1">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
            Welcome back, {displayName}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {dashboard.loading
              ? "Loading your workspace…"
              : dashboard.today.length
                ? `${dashboard.today.length} task${dashboard.today.length === 1 ? " is" : "s are"} asking for your attention today.`
                : activeProjects
                  ? `${activeProjects} active project${activeProjects === 1 ? "" : "s"}. You are all caught up for now.`
                  : "Start with your first project and bring your work together."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/$organizationSlug/projects"
            params={{ organizationSlug }}
            className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <IconPlus className="size-4" aria-hidden="true" /> New project
          </Link>
          <Link
            to="/$organizationSlug/projects"
            params={{ organizationSlug }}
            className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-border/80 bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted/60"
          >
            View projects <IconArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <DashboardKpiStrip tiles={dashboard.kpis} />

      {dashboard.error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {dashboard.error}
        </p>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <DashboardToday
          organizationSlug={organizationSlug}
          rows={dashboard.today}
          loading={dashboard.loading}
        />
        <DashboardDueSoon
          organizationSlug={organizationSlug}
          rows={dashboard.dueSoon}
          loading={dashboard.loading}
        />
      </section>
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <DashboardProjects
          organizationSlug={organizationSlug}
          rollups={dashboard.rollups}
          loading={dashboard.loading}
        />
        <DashboardDistribution slices={dashboard.distribution} />
      </section>
      <DashboardThroughput weeks={dashboard.throughput} summary={dashboard.throughputLabel} />
      <DashboardTeam
        organizationSlug={organizationSlug}
        team={dashboard.team}
        leave={dashboard.leave}
      />
      <DashboardConnected org={organizationId} slug={organizationSlug} />
      {!dashboard.loading && !projects.length ? (
        <div className="rounded-[16px] border border-dashed border-border bg-card px-6 py-10 text-center">
          <IconLayoutKanban className="mx-auto size-6 text-primary" aria-hidden="true" />
          <p className="mt-3 font-medium">Your workspace is ready</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a project to begin organizing work.
          </p>
        </div>
      ) : null}
    </main>
  );
}
