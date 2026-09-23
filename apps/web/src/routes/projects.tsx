import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { client } from "@/lib/api";
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
  const state = useProjects(organization?.id);

  if (!organization) return <EmptyProjectsState />;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <ProjectPageHeader organizationName={organization.name} />
      <ProjectForm
        name={state.name}
        identifier={state.identifier}
        description={state.description}
        loading={state.loading}
        onNameChange={state.setName}
        onIdentifierChange={state.setIdentifier}
        onDescriptionChange={state.setDescription}
        onSubmit={state.createProject}
      />
      {state.error && <ErrorMessage message={state.error} />}
      <ProjectList projects={state.projects} />
    </main>
  );
}

function useProjects(organizationId: string | undefined) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (organizationId) void loadProjects(organizationId);
  }, [organizationId]);

  async function loadProjects(orgId: string) {
    setError(null);
    try {
      setProjects(await client.request<Project[]>(`/organization/${orgId}/projects`));
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load projects"));
    }
  }

  function createProject(event: React.FormEvent) {
    event.preventDefault();
    if (!organizationId || !name.trim() || !identifier.trim()) return;
    void submitProject(organizationId, name, identifier, description);
  }

  async function submitProject(
    orgId: string,
    projectName: string,
    projectIdentifier: string,
    projectDescription: string,
  ) {
    setLoading(true);
    setError(null);
    try {
      const project = await createProjectRequest(orgId, projectName, projectIdentifier, projectDescription);
      setProjects((current) => [project, ...current]);
      resetForm();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to create project"));
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setName("");
    setIdentifier("");
    setDescription("");
  }

  return {
    projects,
    name,
    identifier,
    description,
    loading,
    error,
    setName,
    setIdentifier,
    setDescription,
    createProject,
  };
}

async function createProjectRequest(
  organizationId: string,
  name: string,
  identifier: string,
  description: string,
) {
  return client.request<Project>(`/organization/${organizationId}/projects`, {
    method: "POST",
    body: JSON.stringify({
      name: name.trim(),
      identifier: identifier.trim(),
      description: description.trim() || undefined,
    }),
  });
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function EmptyProjectsState() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Projects</h1>
      <p className="mt-2 text-muted-foreground">Select an organization before opening Projects.</p>
    </main>
  );
}

function ProjectPageHeader({ organizationName }: { organizationName: string }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div>
        <p className="text-sm text-muted-foreground">{organizationName}</p>
        <h1 className="mt-1 text-3xl font-semibold">Projects</h1>
        <p className="mt-2 text-muted-foreground">Plan work, manage tasks and track delivery.</p>
      </div>
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">Back to home</Link>
    </div>
  );
}

function ProjectForm({
  name,
  identifier,
  description,
  loading,
  onNameChange,
  onIdentifierChange,
  onDescriptionChange,
  onSubmit,
}: {
  name: string;
  identifier: string;
  description: string;
  loading: boolean;
  onNameChange: (value: string) => void;
  onIdentifierChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="mt-8 grid gap-3 rounded-xl border bg-card p-5 md:grid-cols-[1fr_180px]">
      <input value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="Project name" className="rounded-md border bg-background px-3 py-2" required />
      <input value={identifier} onChange={(e) => onIdentifierChange(e.target.value)} placeholder="Identifier e.g. APP" className="rounded-md border bg-background px-3 py-2" required />
      <input value={description} onChange={(e) => onDescriptionChange(e.target.value)} placeholder="Description (optional)" className="rounded-md border bg-background px-3 py-2 md:col-span-2" />
      <button disabled={loading} className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50 md:col-span-2">
        {loading ? "Creating..." : "Create project"}
      </button>
    </form>
  );
}

function ProjectList({ projects }: { projects: Project[] }) {
  return (
    <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => <ProjectCard key={project.id} project={project} />)}
      {!projects.length && <p className="text-sm text-muted-foreground">No projects yet. Create the first one above.</p>}
    </section>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link to="/projects/$projectId" params={{ projectId: project.id }} className="rounded-xl border bg-card p-5 transition hover:border-foreground/30">
      <div className="flex items-center gap-2"><span>{project.emoji ?? "📁"}</span><h2 className="font-medium">{project.name}</h2></div>
      <p className="mt-2 text-xs font-medium text-muted-foreground">{project.identifier}</p>
      {project.description && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{project.description}</p>}
    </Link>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{message}</p>;
}
