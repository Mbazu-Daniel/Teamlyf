import { createFileRoute, Link } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useOrganization } from "@/lib/organization";

type Note = { id: string; title: string; content: string; parentId: string | null; ownerId: string; updatedAt: string };

export const Route = createFileRoute("/notes")({ component: NotesPage });

function NotesPage() {
  const { organization } = useOrganization();
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (organization) void loadNotes(); }, [organization?.id]);

  async function loadNotes() {
    if (!organization) return;
    try {
      setError(null);
      setNotes(await api<Note[]>(`/organization/${organization.id}/notes`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load notes");
    }
  }

  async function createNote(event: FormEvent) {
    event.preventDefault();
    if (!organization || !title.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const created = await api<Note>(`/organization/${organization.id}/notes`, {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), content }),
      });
      setNotes((current) => [created, ...current]);
      setTitle("");
      setContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create note");
    } finally {
      setLoading(false);
    }
  }

  if (!organization) return <main className="mx-auto max-w-6xl px-6 py-12"><h1 className="text-2xl font-semibold">Notes</h1><p className="mt-2 text-muted-foreground">Select an organization first.</p></main>;

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <header className="flex items-start justify-between gap-6">
        <div><p className="text-sm text-muted-foreground">{organization.name}</p><h1 className="mt-1 text-3xl font-semibold">Notes</h1><p className="mt-2 text-sm text-muted-foreground">Capture and organize notes for your organization.</p></div>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">Home</Link>
      </header>
      {error && <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-xl border bg-card p-5">
          <h2 className="font-medium">Notes</h2>
          <div className="mt-4 divide-y">
            {notes.map((note) => <Link key={note.id} to="/notes/$noteId" params={{ noteId: note.id }} className="block py-4 first:pt-0 hover:bg-muted/40"><div className="flex items-center justify-between gap-4"><h3 className="font-medium">{note.title}</h3><time className="text-xs text-muted-foreground">{new Date(note.updatedAt).toLocaleDateString()}</time></div><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{note.content || "No content yet."}</p></Link>)}
            {!notes.length && <p className="py-8 text-sm text-muted-foreground">No notes yet.</p>}
          </div>
        </section>
        <form onSubmit={createNote} className="rounded-xl border bg-card p-5">
          <h2 className="font-medium">New note</h2>
          <div className="mt-4 space-y-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title" maxLength={200} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write something..." rows={8} className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm" />
            <button disabled={loading || !title.trim()} className="w-full rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">{loading ? "Creating..." : "Create note"}</button>
          </div>
        </form>
      </div>
    </main>
  );
}
