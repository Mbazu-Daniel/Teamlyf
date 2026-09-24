import { createFileRoute } from "@tanstack/react-router";
import { ProjectListPage, useProjects } from "@/features/projects";
import { useOrganization } from "@/lib/organization";

export const Route = createFileRoute("/projects")({ component: ProjectsRoute });

function ProjectsRoute() {
  const { organization } = useOrganization();
  const state = useProjects(organization?.id);

  if (!organization) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <p className="mt-2 text-muted-foreground">Select an organization before opening Projects.</p>
      </main>
    );
  }

  return <ProjectListPage organizationName={organization.name} state={state} />;
}
