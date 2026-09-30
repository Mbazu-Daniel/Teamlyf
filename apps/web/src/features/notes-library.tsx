import { IconArrowUpRight, IconFileText, IconPlus } from "@tabler/icons-react";
import type { notesApi } from "@/lib/api";
import { noteText } from "./notes/rich-content";
import { PageEmptyState, PagePanel, pagePrimaryAction } from "@/components/workspace/page-layout";

type Note = Awaited<ReturnType<typeof notesApi.list>>[number];
const tones = [
  "from-emerald-500/10 to-teal-500/5 border-emerald-500/20",
  "from-violet-500/10 to-purple-500/5 border-violet-500/20",
  "from-amber-500/10 to-yellow-500/5 border-amber-500/20",
  "from-blue-500/10 to-sky-500/5 border-blue-500/20",
  "from-rose-500/10 to-pink-500/5 border-rose-500/20",
];

export function NotesLibrary({
  notes,
  searching,
  onSelect,
  onCreate,
  creating,
}: {
  notes: Note[];
  searching: boolean;
  onSelect: (id: string) => void;
  onCreate: () => void;
  creating: boolean;
}) {
  const recent = [...notes].sort(
    (a, b) => (Date.parse(b.updatedAt ?? "") || 0) - (Date.parse(a.updatedAt ?? "") || 0),
  );
  return (
    <PagePanel>
      <div className="mb-5 flex items-center justify-between border-b border-border/60 pb-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {searching ? "Search results" : "Recently edited"}
        </h2>
        <span className="rounded-full bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground">
          {notes.length} notes
        </span>
      </div>
      {recent.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {recent.map((note) => {
            const tone =
              tones[
                Array.from(note.id).reduce((value, letter) => value + letter.charCodeAt(0), 0) %
                  tones.length
              ];
            return (
              <button
                key={note.id}
                type="button"
                onClick={() => onSelect(note.id)}
                className={`group flex min-h-[208px] flex-col rounded-[14px] border bg-gradient-to-br p-5 text-left transition-colors duration-200 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${tone}`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="grid size-9 place-items-center rounded-[10px] bg-card/75 text-foreground/70">
                    <IconFileText className="size-4" />
                  </span>
                  <IconArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                </div>
                <h3 className="line-clamp-2 text-sm font-semibold leading-6">
                  {note.title || "Untitled note"}
                </h3>
                <p className="mt-1.5 line-clamp-3 text-xs leading-5 text-muted-foreground">
                  {noteText(note.content) || "Open this note to start writing."}
                </p>
                <div className="mt-auto flex items-center justify-between pt-5 text-[11px] text-muted-foreground">
                  <span>Note</span>
                  <time dateTime={note.updatedAt}>
                    {note.updatedAt
                      ? new Date(note.updatedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })
                      : "No edit date"}
                  </time>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <PageEmptyState
          icon={IconFileText}
          title={searching ? "No matching notes" : "Room for your next idea"}
          description={
            searching
              ? "Try another title or a word from your note."
              : "Capture ideas, meeting notes, and the details worth keeping."
          }
          action={
            !searching && (
              <button
                type="button"
                onClick={onCreate}
                disabled={creating}
                className={pagePrimaryAction}
              >
                <IconPlus className="size-4" />
                {creating ? "Creating…" : "Create note"}
              </button>
            )
          }
        />
      )}
    </PagePanel>
  );
}
