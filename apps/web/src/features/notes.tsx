import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { IconFileText, IconPlus, IconSearch, IconTrash } from "@tabler/icons-react";
import { notesApi, type Note } from "@/lib/api";

export function NotesPage({ organizationId }: { organizationId: string }) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string>();
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const notes = useQuery({ queryKey: ["notes", organizationId], queryFn: () => notesApi.list(organizationId) });
  const selected = notes.data?.find((note) => note.id === selectedId) ?? notes.data?.[0];
  const create = useMutation({
    mutationFn: () => notesApi.create(organizationId, { title: title.trim() || "Untitled note", content }),
    onSuccess: (note) => { setTitle(""); setContent(""); setSelectedId(note.id); void queryClient.invalidateQueries({ queryKey: ["notes", organizationId] }); },
  });
  const update = useMutation({
    mutationFn: () => selected ? notesApi.update(organizationId, selected.id, { title, content }) : Promise.resolve(null),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["notes", organizationId] }),
  });
  const remove = useMutation({
    mutationFn: () => selected ? notesApi.remove(organizationId, selected.id) : Promise.resolve(),
    onSuccess: () => { setSelectedId(undefined); void queryClient.invalidateQueries({ queryKey: ["notes", organizationId] }); },
  });
  const filtered = useMemo(() => (notes.data ?? []).filter((note) => note.title.toLowerCase().includes(search.toLowerCase())), [notes.data, search]);

  if (notes.isPending) return <div className="p-8 text-sm text-muted-foreground">Loading notes...</div>;

  return <div className="flex h-full min-h-0 bg-[var(--app-page-background)]">
    <aside className="hidden w-72 shrink-0 border-r bg-card md:flex md:flex-col">
      <div className="border-b p-4"><div className="flex items-center justify-between"><div><h1 className="text-lg font-semibold">Notes</h1><p className="text-xs text-muted-foreground">Capture and organize your work</p></div><button onClick={() => create.mutate()} className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground"><IconPlus className="size-4"/></button></div>
        <div className="relative mt-4"><IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notes" className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-sm"/></div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">{filtered.map((note) => <button key={note.id} onClick={() => setSelectedId(note.id)} className={`w-full rounded-lg px-3 py-3 text-left ${selected?.id === note.id ? "bg-muted" : "hover:bg-muted/60"}`}><p className="truncate text-sm font-medium">{note.title}</p><p className="mt-1 truncate text-xs text-muted-foreground">{note.content || "Empty note"}</p></button>)}</div>
    </aside>
    <main className="min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex min-h-full max-w-4xl flex-col p-5 sm:p-8">
        {selected ? <><div className="flex items-center justify-between gap-3"><span className="text-xs text-muted-foreground">Last edited {selected.updatedAt ? new Date(selected.updatedAt).toLocaleString() : "just now"}</span><button onClick={() => remove.mutate()} className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><IconTrash className="size-4"/></button></div><input value={title || selected.title} onChange={(e) => setTitle(e.target.value)} onBlur={() => update.mutate()} className="mt-6 border-0 bg-transparent text-3xl font-semibold outline-none" /><textarea value={content || selected.content} onChange={(e) => setContent(e.target.value)} onBlur={() => update.mutate()} placeholder="Start writing..." className="mt-6 min-h-[60vh] resize-none border-0 bg-transparent text-base leading-7 outline-none" /></> : <div className="flex flex-1 flex-col items-center justify-center text-center"><IconFileText className="size-10 text-muted-foreground/40"/><h2 className="mt-4 text-lg font-semibold">No notes yet</h2><p className="mt-1 text-sm text-muted-foreground">Create a note to get started.</p></div>}
      </div>
    </main>
  </div>;
}