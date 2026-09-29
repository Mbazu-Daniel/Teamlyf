import { createFileRoute } from "@tanstack/react-router";
import { NotesPage } from "@/features/notes";
import { useOrganization } from "@/lib/organization";
export const Route = createFileRoute("/$organizationSlug/notes")({ validateSearch: (search: Record<string, unknown>): { note?: string } => ({ note: typeof search.note === "string" ? search.note : undefined }), component: NotesRoute });
function NotesRoute() {
  const { organization } = useOrganization();
  const { note } = Route.useSearch();
  const navigate = Route.useNavigate();
  if (!organization) return <div className="p-8 text-sm text-muted-foreground">Select an organization first.</div>;
  return <NotesPage organizationId={organization.id} selectedId={note} onSelect={(id) => void navigate({ search: { note: id } })} />;
}
