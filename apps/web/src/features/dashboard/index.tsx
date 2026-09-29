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
  const firstName = (session.data?.user?.name || organizationName).split(" ")[0] || "there";
  const activeProjects = projects.filter((project) => !["completed", "cancelled"].includes(project.status ?? "planned")).length;

  return (
    <main className="mx-auto w-full max-w-[1440px] space-y-5 px-4 py-5 pb-8 sm:px-6 lg:px-8">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_360px]">
        <div className="relative overflow-hidden rounded-[18px] border border-primary/15 bg-[linear-gradient(115deg,#faf8ff_0%,#f3eeff_42%,#e2d8ff_100%)] px-7 py-8 shadow-[0_14px_30px_-24px_rgba(86,90,110,0.18)] sm:px-10 sm:py-10 dark:bg-[linear-gradient(115deg,#201a35_0%,#272042_52%,#302553_100%)]">
          <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-primary/20 blur-[92px]" />
          <div className="relative max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Workspace overview</p>
            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.045em] text-foreground sm:text-5xl">Welcome back, {firstName}.</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
              {dashboard.loading ? "Loading your workspace…" : dashboard.today.length ? `${dashboard.today.length} task${dashboard.today.length === 1 ? " is" : "s are"} asking for your attention today.` : activeProjects ? `${activeProjects} active project${activeProjects === 1 ? "" : "s"}. You are all caught up for now.` : "Start with your first project and bring your work together."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/$organizationSlug/projects" params={{ organizationSlug }} className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5">
                <IconPlus className="size-4" aria-hidden="true" /> New project
              </Link>
              <Link to="/$organizationSlug/projects" params={{ organizationSlug }} className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-background/65 px-5 text-sm font-medium text-foreground transition-colors hover:bg-background">
                View projects <IconArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
        <DashboardKpiStrip tiles={dashboard.kpis} />
      </section>

      {dashboard.error ? <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{dashboard.error}</p> : null}

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <DashboardToday organizationSlug={organizationSlug} rows={dashboard.today} loading={dashboard.loading} />
        <DashboardDueSoon organizationSlug={organizationSlug} rows={dashboard.dueSoon} loading={dashboard.loading} />
      </section>
      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <DashboardProjects organizationSlug={organizationSlug} rollups={dashboard.rollups} loading={dashboard.loading} />
        <DashboardDistribution slices={dashboard.distribution} />
      </section>
      <DashboardThroughput weeks={dashboard.throughput} summary={dashboard.throughputLabel} />
      <DashboardTeam organizationSlug={organizationSlug} team={dashboard.team} leave={dashboard.leave} />
      <DashboardConnected org={organizationId} slug={organizationSlug} />
      {!dashboard.loading && !projects.length ? (
        <div className="rounded-[16px] border border-dashed border-border bg-card px-6 py-10 text-center">
          <IconLayoutKanban className="mx-auto size-6 text-primary" aria-hidden="true" />
          <p className="mt-3 font-medium">Your workspace is ready</p>
          <p className="mt-1 text-sm text-muted-foreground">Create a project to begin organizing work.</p>
        </div>
      ) : null}
    </main>
  );
}
