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

export const Route = createFileRoute("/documents")({ component: DocumentsPage });

// fallow-ignore-next-line high-crap-score
function DocumentsPage() {
  const { organization } = useOrganization();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (organization) void loadDocuments();
  }, [organization?.id]);

  async function loadDocuments() {
    if (!organization) return;
    try {
      setError(null);
      setDocuments(await client.request<Document[]>(`/organization/${organization.id}/documents`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load documents");
    }
  }

  // fallow-ignore-next-line high-crap-score
  async function createDocument(event: FormEvent) {
    event.preventDefault();
    if (!organization || !title.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const created = await client.request<Document>(`/organization/${organization.id}/documents`, {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), content }),
      });
      setDocuments((current) => [created, ...current]);
      setTitle("");
      setContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create document");
    } finally {
      setLoading(false);
    }
  }

  if (!organization) {
    return <main className="mx-auto max-w-6xl px-6 py-12"><h1 className="text-2xl font-semibold">Documents</h1><p className="mt-2 text-muted-foreground">Select an organization first.</p></main>;
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <header className="flex items-start justify-between gap-6">
        <div>
          <p className="text-sm text-muted-foreground">{organization.name}</p>
          <h1 className="mt-1 text-3xl font-semibold">Documents</h1>
          <p className="mt-2 text-sm text-muted-foreground">Create, browse, and edit organization documents.</p>
        </div>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">Home</Link>
      </header>

      {error && <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-xl border bg-card p-5">
          <h2 className="font-medium">Your documents</h2>
          <div className="mt-4 divide-y">
            {documents.map((document) => (
              <Link key={document.id} to="/documents/$documentId" params={{ documentId: document.id }} className="block py-4 first:pt-0 last:pb-0 hover:bg-muted/40">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-medium">{document.title}</h3>
                  <time className="text-xs text-muted-foreground">{new Date(document.updatedAt).toLocaleDateString()}</time>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{document.content || "No content yet."}</p>
              </Link>
            ))}
            {!documents.length && <p className="py-8 text-sm text-muted-foreground">No documents yet.</p>}
          </div>
        </section>

        <form onSubmit={createDocument} className="rounded-xl border bg-card p-5">
          <h2 className="font-medium">New document</h2>
          <div className="mt-4 space-y-3">
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Document title" maxLength={200} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            <textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Start writing..." rows={8} className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm" />
            <button disabled={loading || !title.trim()} className="w-full rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">{loading ? "Creating..." : "Create document"}</button>
          </div>
        </form>
      </div>
    </main>
  );
}
