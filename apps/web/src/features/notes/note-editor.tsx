import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useBlocker } from "@tanstack/react-router";
import { notesApi, type Note } from "@/lib/api/notes";
import { WorkflowError, WorkflowSheet, useWorkflowMutation } from "@/components/workspace/workflow";
import {
  pageInput,
  pagePrimaryAction,
  pageSecondaryAction,
} from "@/components/workspace/page-layout";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RichNoteEditor, noteText } from "./rich-content";
import { NoteTaskPicker } from "./task-picker";

export function NoteEditor({
  org,
  note,
  notes,
  onClose,
}: {
  org: string;
  note: Note;
  notes: Note[];
  onClose: () => void;
}) {
  const cache = useQueryClient();
  const [draft, setDraft] = useState(note);
  const [saved, setSaved] = useState(note);
  const [generation, setGeneration] = useState(0);
  const [history, setHistory] = useState(false);
  const dirty = ["title", "content", "parentId", "taskId", "private", "archived"].some(
    (key) => draft[key as keyof Note] !== saved[key as keyof Note],
  );
  const blocker = useBlocker({
    shouldBlockFn: () => dirty,
    withResolver: true,
    enableBeforeUnload: dirty,
  });
  const presence = useQuery({
    queryKey: ["note-presence", org, note.id],
    queryFn: () => notesApi.presence(org, note.id),
    refetchInterval: 15000,
    retry: false,
  });
  const latest = useQuery({
    queryKey: ["note", org, note.id],
    queryFn: () => notesApi.get(org, note.id),
    refetchInterval: 15000,
    retry: false,
  });
  const snapshots = useQuery({
    queryKey: ["note-snapshots", org, note.id],
    queryFn: () => notesApi.snapshots(org, note.id),
    enabled: history,
  });
  const save = useMutation({
    mutationFn: (value: Note) =>
      notesApi.update(org, note.id, {
        title: value.title,
        content: value.content,
        private: value.private,
        archived: value.archived,
        parentId: value.parentId ?? null,
        taskId: value.taskId ?? null,
        revision: saved.revision,
      }),
    onSuccess: (result, submitted) => {
      setSaved({ ...submitted, revision: result.revision });
      setDraft((current) => ({ ...current, revision: result.revision }));
      cache.setQueryData(["note", org, note.id], result);
      void cache.invalidateQueries({ queryKey: ["notes", org] });
      void cache.invalidateQueries({ queryKey: ["note-snapshots", org, note.id] });
    },
  });
  // Debounce only successful editable state. A conflict stays visible until the user resolves it.
  useEffect(() => {
    if (!dirty || save.isPending || save.error || !draft.title.trim()) return;
    const timer = setTimeout(() => save.mutate(draft), 1000);
    return () => clearTimeout(timer);
  }, [draft, dirty, save.isPending, save.error]);
  useEffect(() => {
    if (latest.data && latest.data.revision > saved.revision && !dirty && !save.isPending) {
      setDraft(latest.data);
      setSaved(latest.data);
      setGeneration((value) => value + 1);
    }
  }, [latest.data, dirty, save.isPending, saved.revision]);
  const action = useWorkflowMutation([
    ["notes", org],
    ["note-snapshots", org, note.id],
  ]);
  function load(value: Note) {
    setDraft(value);
    setSaved(value);
    setGeneration((current) => current + 1);
    save.reset();
    cache.setQueryData(["note", org, note.id], value);
  }
  return (
    <section className="space-y-5 rounded-2xl border bg-card p-5 sm:p-7">
      <div className="flex flex-wrap items-center gap-3">
        <button
          disabled={dirty || save.isPending}
          className={pageSecondaryAction}
          onClick={onClose}
        >
          All notes
        </button>
        <span role="status" className="flex-1 text-xs text-muted-foreground">
          {save.isPending ? "Saving…" : dirty ? "Unsaved changes" : "All changes saved"} ·{" "}
          {presence.data?.map((person) => person.name).join(", ") || "You"} viewing
        </span>
        <button className={pageSecondaryAction} onClick={() => setHistory(true)}>
          History
        </button>
        <button
          disabled={save.isPending || !dirty}
          className={pagePrimaryAction}
          onClick={() => save.mutate(draft)}
        >
          Save
        </button>
      </div>
      <WorkflowError error={save.error ?? latest.error ?? presence.error ?? action.error} />
      {save.error && (
        <div className="space-y-3">
          <p className="text-sm">
            Your draft is still here. Copy any changes you want to keep before reloading.
          </p>
          <ConfirmDialog
            title="Reload latest note?"
            description="This discards the unsaved draft and loads the latest saved version."
            confirmLabel="Reload latest"
            onConfirm={() => action.mutate(async () => load(await notesApi.get(org, note.id)))}
            trigger={<button className={pageSecondaryAction}>Reload latest</button>}
          />
        </div>
      )}
      <input
        className={`${pageInput} text-xl`}
        aria-label="Note title"
        value={draft.title}
        onChange={(event) => setDraft({ ...draft, title: event.target.value })}
        maxLength={255}
      />
      <div className="flex flex-wrap gap-4 text-sm">
        <label>
          <input
            type="checkbox"
            checked={draft.private}
            onChange={(event) => setDraft({ ...draft, private: event.target.checked })}
          />{" "}
          Private (owner only)
        </label>
        <label>
          <input
            type="checkbox"
            checked={draft.archived}
            onChange={(event) => setDraft({ ...draft, archived: event.target.checked })}
          />{" "}
          Archived
        </label>
      </div>
      <RichNoteEditor
        key={generation}
        initial={draft.content}
        onChange={(content) => setDraft((value) => ({ ...value, content }))}
      />
      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span>Parent note</span>
          <select
            className={pageInput}
            value={draft.parentId ?? ""}
            onChange={(event) => setDraft({ ...draft, parentId: event.target.value || null })}
          >
            <option value="">Root level</option>
            {notes
              .filter((item) => item.id !== note.id && !item.archived)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
          </select>
        </label>
        <NoteTaskPicker
          org={org}
          selected={draft.taskId ?? null}
          onChange={(taskId) => setDraft({ ...draft, taskId })}
        />
      </div>
      {history && (
        <WorkflowSheet title="Note history" onClose={() => setHistory(false)}>
          <WorkflowError error={snapshots.error ?? action.error} />
          {snapshots.isPending && <p className="text-sm">Loading history…</p>}
          {snapshots.data?.map((snapshot) => (
            <article className="space-y-3 border-b py-4" key={snapshot.id}>
              <p className="text-sm font-medium">
                Revision {snapshot.revision} · {new Date(snapshot.createdAt).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-3">
                {noteText(snapshot.content)}
              </p>
              <ConfirmDialog
                title="Restore this revision?"
                description="Your current saved note remains in history. Save any pending changes first."
                confirmLabel="Restore"
                onConfirm={() =>
                  action.mutate(async () => {
                    const value = await notesApi.restore(org, note.id, snapshot.id, saved.revision);
                    load(value);
                    setHistory(false);
                  })
                }
                trigger={
                  <button
                    disabled={dirty || save.isPending || action.isPending}
                    className={pageSecondaryAction}
                  >
                    Restore revision
                  </button>
                }
              />
            </article>
          ))}
          {snapshots.data?.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Earlier revisions appear after your first edit.
            </p>
          )}
        </WorkflowSheet>
      )}
      {blocker.status === "blocked" && (
        <WorkflowSheet
          title="Unsaved note"
          description="Keep editing to save your work, or discard this draft and leave."
          onClose={() => blocker.reset()}
        >
          <div className="flex gap-3">
            <button className={pagePrimaryAction} onClick={() => blocker.reset()}>
              Keep editing
            </button>
            <button className={pageSecondaryAction} onClick={() => blocker.proceed()}>
              Discard and leave
            </button>
          </div>
        </WorkflowSheet>
      )}
    </section>
  );
}
