import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/features/dashboard";
import { useOrganization } from "@/lib/organization";
import { useProjects } from "@/features/projects";

export const Route = createFileRoute("/$organizationSlug/")({ component: OrganizationDashboard });

function OrganizationDashboard() {
  const { organizationSlug } = Route.useParams();
  const { organization } = useOrganization();
  const state = useProjects(organization?.id);

  if (!organization) {
    return <main className="mx-auto max-w-6xl px-6 py-12"><h1 className="text-2xl font-semibold">Dashboard</h1><p className="mt-2 text-muted-foreground">Select an organization before opening the dashboard.</p></main>;
  }

  if (state.projectsLoading) {
    return <main className="mx-auto flex h-full max-w-6xl items-center justify-center px-6 py-12 text-sm text-muted-foreground">Loading projects…</main>;
  }

  if (state.error) {
    return <main className="mx-auto max-w-6xl px-6 py-12"><h1 className="text-2xl font-semibold">Dashboard</h1><p className="mt-2 text-sm text-destructive">{state.error}</p></main>;
  }

  return <DashboardPage organizationName={organization.name} organizationSlug={organizationSlug} projects={state.projects} />;
}
