import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import {
  IconDeviceFloppy as IconSave,
  IconFile,
  IconFolder,
  IconPlus,
  IconSearch,
} from "@tabler/icons-react";
import { PageHeader } from "@/components/page-header";
import { AppDialog } from "@/components/app-dialog";
import { ResourceState } from "@/components/resource-state";
import { api, organizationPath, useApiResource } from "@/lib/api";

type Note = {
  id: string;
  title: string;
  content: string;
  parentId: string | null;
  linkedTaskId?: string | null;
  updatedAt: string;
};
export const Route = createFileRoute("/$tenant/notes")({ component: Notes });
function Notes() {
  const { tenant } = useParams({ strict: false }) as { tenant: string };
  const notes = useApiResource<Note[]>(organizationPath(tenant, "/notes"));
  const [noteId, setNoteId] = useState("");
  const [draft, setDraft] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const detail = useApiResource<Note>(
    noteId ? organizationPath(tenant, `/notes/${noteId}`) : null,
  );
  useEffect(() => {
    if (!noteId && notes.data?.[0]) setNoteId(notes.data[0].id);
  }, [noteId, notes.data]);
  useEffect(() => {
    if (detail.data) setDraft(detail.data.content);
  }, [detail.data]);
  const filtered = useMemo(
    () =>
      (notes.data ?? []).filter((note) =>
        note.title.toLowerCase().includes(search.toLowerCase()),
      ),
    [notes.data, search],
  );
  const tree = useMemo(() => {
    const byParent = new Map<string | null, Note[]>();
    filtered.forEach((note) => byParent.set(note.parentId ?? null, [...(byParent.get(note.parentId ?? null) ?? []), note]));
    const walk = (parentId: string | null, depth = 0): Array<Note & { depth: number }> => (byParent.get(parentId) ?? []).flatMap((note) => [{ ...note, depth }, ...walk(note.id, depth + 1)]);
    return walk(null);
  }, [filtered]);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    try {
      const created = await api<Note>(organizationPath(tenant, "/notes"), {
        method: "POST",
        body: JSON.stringify({
          title: String(form.get("title")),
          parentId: String(form.get("parentId") || undefined),
          linkedTaskId: String(form.get("linkedTaskId") || undefined),
          content: "",
        }),
      });
      setNoteId(created.id);
      setNewOpen(false);
      await notes.reload();
    } catch (reason) {
      setMessage(
        reason instanceof Error ? reason.message : "Unable to create note",
      );
    } finally {
      setSaving(false);
    }
  }
  async function save() {
    if (!noteId) return;
    setSaving(true);
    try {
      await api(organizationPath(tenant, `/notes/${noteId}`), {
        method: "PATCH",
        body: JSON.stringify({ content: draft }),
      });
      setMessage("Saved. Changes are synced to the workspace.");
      await notes.reload();
    } catch (reason) {
      setMessage(
        reason instanceof Error ? reason.message : "Unable to save note",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <PageHeader
        title="Notes"
        description="Capture ideas, organize them into nested spaces, and keep a synced source of truth."
        action={
          <button
            onClick={() => setNewOpen(true)}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-violet-600 px-3 text-sm font-semibold text-white"
          >
            <IconPlus className="size-4" />
            New note
          </button>
        }
      />
      <section className="surface grid min-h-[38rem] overflow-hidden rounded-2xl lg:grid-cols-[16rem_1fr]">
        <aside className="border-b bg-muted/25 p-4 lg:border-r lg:border-b-0">
          <label className="mb-4 flex items-center rounded-lg border bg-white px-2.5 py-2 text-sm text-muted-foreground">
            <IconSearch className="mr-2 size-4" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Find a note"
              className="min-w-0 bg-transparent outline-none"
            />
          </label>
          <ResourceState
            loading={notes.loading}
            error={notes.error}
            onRetry={notes.reload}
            isEmpty={notes.data?.length === 0}
            emptyTitle="No notes yet"
          >
            {tree.map((note) => (
              <button
                key={note.id}
                onClick={() => setNoteId(note.id)}
                style={{ paddingLeft: `${0.625 + note.depth * 0.75}rem` }}
                className={`flex w-full items-center gap-2 rounded-lg py-2 pr-2.5 text-left text-sm ${note.id === noteId ? "bg-white font-semibold text-violet-700 shadow-sm" : "text-muted-foreground hover:bg-white"}`}
              >
                <span className="text-violet-500">
                  {note.parentId ? (
                    <IconFile className="size-4" />
                  ) : (
                    <IconFolder className="size-4" />
                  )}
                </span>
                <span className="truncate">{note.title}</span>
              </button>
            ))}
          </ResourceState>
        </aside>
        <div className="p-5 sm:p-8">
          <ResourceState
            loading={detail.loading}
            error={detail.error}
            onRetry={detail.reload}
            isEmpty={Boolean(noteId && !detail.data)}
            emptyTitle="Select a note"
          >
            {detail.data && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="eyebrow">Collaborative note</p>
                    <h2 className="mt-2 text-2xl font-semibold">
                      {detail.data.title}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Last updated{" "}
                      {new Date(detail.data.updatedAt).toLocaleString()}
                    </p>
                    {detail.data.linkedTaskId && <p className="mt-1 text-xs font-medium text-violet-700">Linked task · {detail.data.linkedTaskId}</p>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="flex -space-x-1"><span className="grid size-6 place-items-center rounded-full border-2 border-white bg-violet-500 text-[0.55rem] font-bold text-white">Y</span><span className="grid size-6 place-items-center rounded-full border-2 border-white bg-emerald-500 text-[0.55rem] font-bold text-white">+</span></span><span>2 collaborators online</span></div>
                  <button
                    onClick={() => void save()}
                    disabled={saving}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-violet-600 px-3 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    <IconSave className="size-4" />
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onBlur={() => void save()}
                  className="mt-7 min-h-[25rem] w-full resize-y rounded-2xl border bg-white p-5 text-sm leading-7 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  placeholder="Capture what matters…"
                />
                {message && (
                  <p className="mt-3 text-sm text-violet-700">{message}</p>
                )}
              </>
            )}
          </ResourceState>
        </div>
      </section>
      {newOpen && (
        <AppDialog
          title="New note"
          description="Choose a parent to create a nested note, or leave it blank for a top-level space."
          onClose={() => setNewOpen(false)}
        >
          <form onSubmit={create} className="space-y-4">
            <label className="block text-sm font-semibold">
              Title
              <input
                required
                name="title"
                className="mt-1.5 h-10 w-full rounded-xl border px-3 text-sm"
              />
            </label>
            <label className="block text-sm font-semibold">Link a task <input name="linkedTaskId" placeholder="Optional task ID" className="mt-1.5 h-10 w-full rounded-xl border px-3 text-sm" /></label>
            <label className="block text-sm font-semibold">
              Parent note
              <select
                name="parentId"
                className="mt-1.5 h-10 w-full rounded-xl border bg-white px-3 text-sm"
              >
                <option value="">Top level</option>
                {notes.data?.map((note) => (
                  <option key={note.id} value={note.id}>
                    {note.title}
                  </option>
                ))}
              </select>
            </label>
            <button
              disabled={saving}
              className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white"
            >
              Create note
            </button>
          </form>
        </AppDialog>
      )}
    </>
  );
}
