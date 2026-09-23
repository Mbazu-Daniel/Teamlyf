import { createFileRoute, Link } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { client } from "@/lib/api";
import { useOrganization } from "@/lib/organization";

type Note = { id: string; title: string; content: string; parentId: string | null; ownerId: string; updatedAt: string };

export const Route = createFileRoute("/notes/$noteId")({ component: NotePage });

// fallow-ignore-next-line high-crap-score
function NotePage() {
  const { organization } = useOrganization();
  const { noteId } = Route.useParams();
  const [note, setNote] = useState<Note | null>(null);
  const [children, setChildren] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (organization) void loadNote(); }, [organization?.id, noteId]);

  async function loadNote() {
    if (!organization) return;
    setLoading(true);
    setError(null);
    try {
      const current = await client.request<Note>(`/organization/${organization.id}/notes/${noteId}`);
      setNote(current);
      setTitle(current.title);
      setContent(current.content);
      setChildren(await client.request<Note[]>(`/organization/${organization.id}/notes?parentId=${current.id}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load note");
    } finally { setLoading(false); }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!organization || !note) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await client.request<Note>(`/organization/${organization.id}/notes/${note.id}`, { method: "PATCH", body: JSON.stringify({ title: title.trim(), content }) });
      setNote(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save note");
    } finally { setSaving(false); }
  }

  if (!organization) return <main className="mx-auto max-w-4xl px-6 py-12"><p className="text-muted-foreground">Select an organization first.</p></main>;
  if (loading) return <main className="mx-auto max-w-4xl px-6 py-12"><p className="text-muted-foreground">Loading note...</p></main>;
  if (!note) return <main className="mx-auto max-w-4xl px-6 py-12"><h1 className="text-2xl font-semibold">Note not found</h1>{error && <p className="mt-2 text-sm text-destructive">{error}</p>}</main>;

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <Link to="/notes" className="text-sm text-muted-foreground hover:text-foreground">← Notes</Link>
      {error && <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
        <form onSubmit={save} className="rounded-xl border bg-card p-5">
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} className="w-full rounded-md border bg-background px-3 py-2 text-xl font-medium" />
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={20} className="mt-4 w-full resize-y rounded-md border bg-background px-3 py-3 text-sm leading-6" />
          <div className="mt-4 flex justify-end"><button disabled={saving || !title.trim()} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">{saving ? "Saving..." : "Save changes"}</button></div>
        </form>
        <aside className="rounded-xl border bg-card p-5">
          <h2 className="font-medium">Sub-notes</h2>
          <div className="mt-4 space-y-2">
            {children.map((child) => <Link key={child.id} to="/notes/$noteId" params={{ noteId: child.id }} className="block rounded-md border p-3 hover:bg-muted/40"><p className="text-sm font-medium">{child.title}</p><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{child.content || "No content yet."}</p></Link>)}
            {!children.length && <p className="text-sm text-muted-foreground">No sub-notes.</p>}
          </div>
        </aside>
      </div>
    </main>
  );
}
