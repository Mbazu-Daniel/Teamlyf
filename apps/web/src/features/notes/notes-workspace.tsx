import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { notesApi, type Note } from "@/lib/api/notes";
import { NotesLibrary } from "../notes-library";
import { NoteEditor } from "./note-editor";
import { noteText } from "./rich-content";
import {
  PageHeader,
  WorkspacePage,
  pageInput,
  pagePrimaryAction,
  pageSecondaryAction,
} from "@/components/workspace/page-layout";
import { WorkflowError, useWorkflowMutation } from "@/components/workspace/workflow";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function NotesPage({
  organizationId: org,
  selectedId,
  onSelect,
}: {
  organizationId: string;
  selectedId?: string;
  onSelect: (id?: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [parent, setParent] = useState<string | null>(null);
  const notes = useQuery({
    queryKey: ["notes", org],
    queryFn: () => notesApi.list(org),
    retry: false,
  });
  const selected = useQuery({
    queryKey: ["note", org, selectedId],
    queryFn: () => notesApi.get(org, selectedId!),
    enabled: !!selectedId,
    retry: false,
  });
  const mutation = useWorkflowMutation([["notes", org]]);
  const filtered = (notes.data ?? []).filter((note) => {
    if (note.archived !== (filter === "archived")) return false;
    if (filter === "favorites" && !note.favorite) return false;
    if (filter === "private" && !note.private) return false;
    if (!search && filter === "all" && (note.parentId ?? null) !== parent) return false;
    return (note.title + " " + noteText(note.content)).toLowerCase().includes(search.toLowerCase());
  });
  function create() {
    mutation.mutate(async () => {
      const note = await notesApi.create(org, {
        title: "Untitled note",
        content: "",
        parentId: parent,
        private: filter === "private",
      });
      onSelect(note.id);
    });
  }
  const selectedNote = selected.data;
  return (
    <WorkspacePage>
      <PageHeader
        title="Notes"
        description="Ideas, decisions and knowledge, connected."
        actions={
          <button disabled={mutation.isPending} className={pagePrimaryAction} onClick={create}>
            New note
          </button>
        }
      />
      <WorkflowError error={notes.error ?? selected.error ?? mutation.error} />
      {selectedId ? (
        selectedNote ? (
          <NoteEditor
            key={selectedId}
            org={org}
            note={selectedNote}
            notes={notes.data ?? []}
            onClose={() => onSelect(undefined)}
          />
        ) : (
          <p className="text-sm">
            {selected.isPending ? "Loading note…" : "This note is unavailable."}
          </p>
        )
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            <input
              className={`${pageInput} sm:max-w-sm`}
              aria-label="Search notes"
              placeholder="Search notes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className={`${pageInput} sm:max-w-48`}
              aria-label="Notes filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All notes</option>
              <option value="favorites">Favorites</option>
              <option value="private">Private notes</option>
              <option value="archived">Archived</option>
            </select>
            {parent && (
              <button
                className={pageSecondaryAction}
                onClick={() =>
                  setParent(notes.data?.find((note) => note.id === parent)?.parentId ?? null)
                }
              >
                Up one level
              </button>
            )}
          </div>
          {notes.isPending ? (
            <p className="text-sm">Loading notes…</p>
          ) : (
            <>
              <NotesLibrary
                notes={filtered}
                searching={!!search || filter !== "all"}
                onSelect={onSelect}
                onCreate={create}
                creating={mutation.isPending}
              />
              <div className="divide-y rounded-xl border bg-card px-5">
                {filtered.map((note) => (
                  <NoteActions
                    key={note.id}
                    note={note}
                    childrenCount={
                      (notes.data ?? []).filter((child) => child.parentId === note.id).length
                    }
                    onChildren={() => setParent(note.id)}
                    busy={mutation.isPending}
                    onAction={(operation) => mutation.mutate(operation)}
                    org={org}
                    onDuplicate={onSelect}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </WorkspacePage>
  );
}

function NoteActions({
  note,
  org,
  childrenCount,
  busy,
  onChildren,
  onAction,
  onDuplicate,
}: {
  note: Note;
  org: string;
  childrenCount: number;
  busy: boolean;
  onChildren: () => void;
  onAction: (operation: () => Promise<unknown>) => void;
  onDuplicate: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 py-3">
      <span className="min-w-0 flex-1 truncate text-sm">{note.title}</span>
      <button className={pageSecondaryAction} onClick={onChildren}>
        {childrenCount} nested
      </button>
      <button
        disabled={busy}
        className={pageSecondaryAction}
        onClick={() => onAction(() => notesApi.favorite(org, note.id, !note.favorite))}
      >
        {note.favorite ? "Unfavorite" : "Favorite"}
      </button>
      <button
        disabled={busy}
        className={pageSecondaryAction}
        onClick={() =>
          onAction(async () => onDuplicate((await notesApi.duplicate(org, note.id)).id))
        }
      >
        Duplicate
      </button>
      <ConfirmDialog
        title="Delete this note?"
        description="The note and its saved history will be permanently removed. Move any child notes first."
        confirmLabel="Delete"
        destructive
        onConfirm={() => onAction(() => notesApi.remove(org, note.id))}
        trigger={
          <button disabled={busy} className={pageSecondaryAction}>
            Delete
          </button>
        }
      />
    </div>
  );
}
