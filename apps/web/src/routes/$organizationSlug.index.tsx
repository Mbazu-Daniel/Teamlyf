import { createFileRoute } from "@tanstack/react-router";
import { ProjectListPage, useProjects } from "@/features/projects";
import { useOrganization } from "@/lib/organization";

export const Route = createFileRoute("/$organizationSlug/")({ component: OrganizationDashboard });

function OrganizationDashboard() {
  const { organizationSlug } = Route.useParams();
  const { organization } = useOrganization();
  const state = useProjects(organization?.id);

  if (!organization) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Select an organization before opening the dashboard.</p>
      </main>
    );
  }

  return (
    <ProjectListPage
      organizationName={organization.name}
      organizationSlug={organizationSlug}
      state={state}
    />
  );
}
