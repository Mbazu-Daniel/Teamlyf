import { createFileRoute } from "@tanstack/react-router";
import { NotesPage } from "@/features/notes";
import { useOrganization } from "@/lib/organization";
export const Route = createFileRoute("/$organizationSlug/notes")({ component: NotesRoute });
function NotesRoute() {
  const { organization } = useOrganization();
  if (!organization) return <div className="p-8 text-sm text-muted-foreground">Select an organization first.</div>;
  return <NotesPage organizationId={organization.id} />;
}