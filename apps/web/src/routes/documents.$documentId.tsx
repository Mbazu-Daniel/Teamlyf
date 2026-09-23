import { createFileRoute, Link } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { client } from "@/lib/api";
import { useOrganization } from "@/lib/organization";

type Document = {
  id: string;
  title: string;
  mimeType: string;
  content: string | null;
  parentId: string | null;
  ownerId: string;
  updatedAt: string;
};

type DocumentVersion = {
  id: string;
  version: string;
  title: string;
  content: string | null;
  createdById: string;
  createdAt: string;
};

export const Route = createFileRoute("/documents/$documentId")({ component: DocumentPage });
function DocumentPage() {
  const { organization } = useOrganization();
  const { documentId } = Route.useParams();
  const [document, setDocument] = useState<Document | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (organization) void loadDocument();
  }, [organization?.id, documentId]);
  async function loadDocument() {
    if (!organization) return;
    setLoading(true);
    setError(null);
    try {
      const [current, history] = await Promise.all([
        client.request<Document>(`/organization/${organization.id}/documents/${documentId}`),
        client.request<DocumentVersion[]>(`/organization/${organization.id}/documents/${documentId}/versions`),
      ]);
      setDocument(current);
      setTitle(current.title);
      setContent(current.content ?? "");
      setVersions(history);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load document");
    } finally {
      setLoading(false);
    }
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!organization || !document) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await client.request<Document>(`/organization/${organization.id}/documents/${document.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: title.trim(), content }),
      });
      setDocument(updated);
      const history = await client.request<DocumentVersion[]>(`/organization/${organization.id}/documents/${document.id}/versions`);
      setVersions(history);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save document");
    } finally {
      setSaving(false);
    }
  }

  if (!organization) return <main className="mx-auto max-w-4xl px-6 py-12"><p className="text-muted-foreground">Select an organization first.</p></main>;
  if (loading) return <main className="mx-auto max-w-4xl px-6 py-12"><p className="text-muted-foreground">Loading document...</p></main>;
  if (!document) return <main className="mx-auto max-w-4xl px-6 py-12"><h1 className="text-2xl font-semibold">Document not found</h1>{error && <p className="mt-2 text-sm text-destructive">{error}</p>}</main>;

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <Link to="/documents" className="text-sm text-muted-foreground hover:text-foreground">← Documents</Link>
          <h1 className="mt-2 text-3xl font-semibold">{document.title}</h1>
        </div>
        <time className="text-xs text-muted-foreground">Updated {new Date(document.updatedAt).toLocaleString()}</time>
      </header>

      {error && <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_280px]">
        <form onSubmit={save} className="rounded-xl border bg-card p-5">
          <div className="space-y-4">
            <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} className="w-full rounded-md border bg-background px-3 py-2 text-lg font-medium" />
            <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={22} className="w-full resize-y rounded-md border bg-background px-3 py-3 text-sm leading-6" />
            <div className="flex justify-end">
              <button disabled={saving || !title.trim()} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">{saving ? "Saving..." : "Save changes"}</button>
            </div>
          </div>
        </form>

        <aside className="rounded-xl border bg-card p-5">
          <h2 className="font-medium">Version history</h2>
          <div className="mt-4 space-y-3">
            {versions.map((version) => (
              <div key={version.id} className="rounded-md border p-3">
                <p className="text-sm font-medium">Version {version.version}</p>
                <p className="mt-1 text-xs text-muted-foreground">{version.title}</p>
                <time className="mt-1 block text-xs text-muted-foreground">{new Date(version.createdAt).toLocaleString()}</time>
              </div>
            ))}
            {!versions.length && <p className="text-sm text-muted-foreground">No previous versions.</p>}
          </div>
        </aside>
      </div>
    </main>
  );
}
