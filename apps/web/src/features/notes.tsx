import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { IconFileText, IconPlus, IconSearch, IconTrash } from "@tabler/icons-react";
import { notesApi } from "@/lib/api";

export function NotesPage({ organizationId }: { organizationId: string }) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string>();
  const [draftId, setDraftId] = useState<string>();
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const notes = useQuery({
    queryKey: ["notes", organizationId],
    queryFn: () => notesApi.list(organizationId),
  });

  const filtered = useMemo(
    () =>
      (notes.data ?? []).filter((note) =>
        note.title.toLowerCase().includes(search.toLowerCase()) ||
        note.content.toLowerCase().includes(search.toLowerCase()),
      ),
    [notes.data, search],
  );

  const selected = filtered.find((note) => note.id === selectedId) ?? filtered[0];

  useEffect(() => {
    if (!selected) {
      setSelectedId(undefined);
      setDraftId(undefined);
      setTitle("");
      setContent("");
      return;
    }

    if (draftId !== selected.id) {
      setSelectedId(selected.id);
      setDraftId(selected.id);
      setTitle(selected.title);
      setContent(selected.content);
    }
  }, [draftId, selected]);

  const create = useMutation({
    mutationFn: () => notesApi.create(organizationId, { title: "Untitled note", content: "" }),
    onSuccess: (note) => {
      setSelectedId(note.id);
      setDraftId(note.id);
      setTitle(note.title);
      setContent(note.content);
      void queryClient.invalidateQueries({ queryKey: ["notes", organizationId] });
    },
  });

  const update = useMutation({
    mutationFn: () =>
      selected
        ? notesApi.update(organizationId, selected.id, { title, content })
        : Promise.resolve(null),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notes", organizationId] });
    },
  });

  const remove = useMutation({
    mutationFn: () => (selected ? notesApi.remove(organizationId, selected.id) : Promise.resolve()),
    onSuccess: () => {
      setSelectedId(undefined);
      setDraftId(undefined);
      setTitle("");
      setContent("");
      void queryClient.invalidateQueries({ queryKey: ["notes", organizationId] });
    },
  });

  if (notes.isPending) return <div className="p-8 text-sm text-muted-foreground">Loading notes...</div>;
  if (notes.isError) return <div className="p-8 text-sm text-destructive">Unable to load notes.</div>;

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-y-auto p-3 md:p-4">
      <section className="rounded-[16px] border border-[var(--app-panel-border)] bg-white/90 p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notes</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {notes.data?.length ?? 0} {(notes.data?.length ?? 0) === 1 ? "note" : "notes"} total
            </p>
          </div>
          <div className="flex w-full max-w-[720px] gap-3">
            <div className="relative min-w-0 flex-1">
              <IconSearch className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search notes..."
                className="h-12 w-full rounded-[14px] border bg-muted/30 pl-11 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
              />
            </div>
            <button
              type="button"
              disabled={create.isPending}
              onClick={() => create.mutate()}
              className="inline-flex h-12 items-center gap-2 rounded-[12px] bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              <IconPlus className="size-4" />
              New Note
            </button>
          </div>
        </div>
      </section>

      <div className="grid min-h-0 gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-[16px] border border-[var(--app-panel-border)] bg-card p-2">
          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Recently opened
          </div>
          <div className="space-y-1">
            {filtered.map((note) => (
              <button
                type="button"
                key={note.id}
                onClick={() => setSelectedId(note.id)}
                className={"w-full rounded-xl px-3 py-3 text-left " + (selected?.id === note.id ? "bg-primary/10 text-primary" : "hover:bg-muted")}
              >
                <p className="truncate text-sm font-medium">{note.title || "Untitled"}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{note.content || "Empty note"}</p>
              </button>
            ))}
          </div>
        </aside>

        <main className="min-w-0 rounded-[16px] border border-[var(--app-panel-border)] bg-white/90 p-5 shadow-sm sm:p-8">
          {selected ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Last edited {selected.updatedAt ? new Date(selected.updatedAt).toLocaleString() : "just now"}
                </span>
                <button
                  type="button"
                  onClick={() => remove.mutate()}
                  className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Delete note"
                >
                  <IconTrash className="size-4" />
                </button>
              </div>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onBlur={() => update.mutate()}
                className="mt-6 w-full border-0 bg-transparent text-3xl font-semibold outline-none"
                aria-label="Note title"
              />
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                onBlur={() => update.mutate()}
                placeholder="Start writing..."
                className="mt-6 min-h-[55vh] w-full resize-none border-0 bg-transparent text-base leading-7 outline-none"
                aria-label="Note content"
              />
            </>
          ) : (
            <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
              <IconFileText className="size-10 text-muted-foreground/40" />
              <h2 className="mt-4 text-2xl font-semibold">No notes yet</h2>
              <p className="mt-1 text-sm text-muted-foreground">Create a note to get started.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
