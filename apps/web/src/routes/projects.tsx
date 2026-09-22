import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useOrganization } from "@/lib/organization";

type Project = {
  id: string;
  name: string;
  identifier: string;
  description: string | null;
  emoji: string | null;
};

export const Route = createFileRoute("/projects")({ component: ProjectsPage });

function ProjectsPage() {
  const { organization } = useOrganization();
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organization) return;
    void loadProjects();
  }, [organization?.id]);

  async function loadProjects() {
    if (!organization) return;
    setError(null);
    try {
      setProjects(await api<Project[]>(`/organization/${organization.id}/projects`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load projects");
    }
  }

  async function createProject(event: React.FormEvent) {
    event.preventDefault();
    if (!organization || !name.trim() || !identifier.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const project = await api<Project>(`/organization/${organization.id}/projects`, {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          identifier: identifier.trim(),
          description: description.trim() || undefined,
        }),
      });
      setProjects((current) => [project, ...current]);
      setName("");
      setIdentifier("");
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create project");
    } finally {
      setLoading(false);
    }
  }

  if (!organization) {
    return <main className="mx-auto max-w-6xl px-6 py-12"><h1 className="text-2xl font-semibold">Projects</h1><p className="mt-2 text-muted-foreground">Select an organization before opening Projects.</p></main>;
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-start justify-between gap-6">
        <div><p className="text-sm text-muted-foreground">{organization.name}</p><h1 className="mt-1 text-3xl font-semibold">Projects</h1><p className="mt-2 text-muted-foreground">Plan work, manage tasks and track delivery.</p></div>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">Back to home</Link>
      </div>

      <form onSubmit={createProject} className="mt-8 grid gap-3 rounded-xl border bg-card p-5 md:grid-cols-[1fr_180px]">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name" className="rounded-md border bg-background px-3 py-2" required />
        <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Identifier e.g. APP" className="rounded-md border bg-background px-3 py-2" required />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" className="rounded-md border bg-background px-3 py-2 md:col-span-2" />
        <button disabled={loading} className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50 md:col-span-2">{loading ? "Creating..." : "Create project"}</button>
      </form>

      {error && <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}

      <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Link key={project.id} to="/projects/$projectId" params={{ projectId: project.id }} className="rounded-xl border bg-card p-5 transition hover:border-foreground/30">
            <div className="flex items-center gap-2"><span>{project.emoji ?? "📁"}</span><h2 className="font-medium">{project.name}</h2></div>
            <p className="mt-2 text-xs font-medium text-muted-foreground">{project.identifier}</p>
            {project.description && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{project.description}</p>}
          </Link>
        ))}
        {!projects.length && <p className="text-sm text-muted-foreground">No projects yet. Create the first one above.</p>}
      </section>
    </main>
  );
}
