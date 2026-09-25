import { useState, type FormEvent } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { Comment } from "@/lib/api";
import { ErrorMessage, MutedMessage } from "./feedback";
import { formatRelativeTime } from "./relative-time";
import { useTaskComments } from "./use-task-comments";

type TaskCommentsProps = {
  organizationId: string;
  projectId: string;
  taskId: string;
};

export function TaskComments({ organizationId, projectId, taskId }: TaskCommentsProps) {
  const thread = useTaskComments(organizationId, projectId, taskId);
  const [draft, setDraft] = useState("");
  const writeError = thread.createError ?? thread.updateError ?? thread.deleteError;

  function submitComment(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim() || thread.creating) return;
    // The draft only clears once the server owns the comment; a failure keeps
    // the text in the composer while the optimistic row rolls back.
    thread.createComment(draft, () => setDraft(""));
  }

  return (
    <section aria-label="Comments" className="space-y-3 border-t pt-6">
      <h3 className="text-sm font-semibold">Comments</h3>
      <MutedMessage message="Authors show as short ids — this domain has no user lookup yet." />
      <ThreadBody thread={thread} />
      {writeError && <ErrorMessage message={writeError} />}
      <form onSubmit={submitComment} className="space-y-2">
        <textarea
          aria-label="Write a comment"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write a comment..."
          rows={3}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!draft.trim() || thread.creating}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
          >
            {thread.creating ? "Posting..." : "Comment"}
          </button>
        </div>
      </form>
    </section>
  );
}

function ThreadBody({ thread }: { thread: ReturnType<typeof useTaskComments> }) {
  if (thread.loading) return <Skeleton className="h-24 w-full" />;
  if (thread.error) {
    return (
      <div className="space-y-2">
        <ErrorMessage message={thread.error} />
        <button
          type="button"
          onClick={thread.retry}
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
        >
          Try again
        </button>
      </div>
    );
  }
  if (!thread.comments.length) return <MutedMessage message="No comments yet" />;

  return (
    <ul className="space-y-3">
      {thread.comments.map((comment) => (
        <CommentRow
          key={comment.id}
          comment={comment}
          own={comment.actorId === thread.currentUserId}
          updating={thread.updating}
          onSave={(body) => thread.updateComment({ commentId: comment.id, body })}
          onDelete={() => thread.deleteComment(comment.id)}
        />
      ))}
    </ul>
  );
}

type CommentRowProps = {
  comment: Comment;
  own: boolean;
  updating: boolean;
  onSave: (body: string) => void;
  onDelete: () => void;
};

function CommentRow({ comment, own, updating, onSave, onDelete }: CommentRowProps) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(comment.body ?? "");

  function saveEdit(event: FormEvent) {
    event.preventDefault();
    const next = body.trim();
    if (!next || updating) return;
    onSave(next);
    setEditing(false);
  }

  return (
    <li className="flex gap-3 rounded-md bg-muted/40 p-3">
      <span
        aria-hidden="true"
        title={comment.actorId}
        className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
      >
        {actorInitials(comment.actorId)}
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-semibold" title={comment.actorId}>
            {actorLabel(comment.actorId)}
          </span>
          <time dateTime={comment.createdAt} className="shrink-0 text-xs text-muted-foreground">
            {formatRelativeTime(comment.createdAt)}
          </time>
        </div>
        {editing ? (
          <form onSubmit={saveEdit} className="space-y-2">
            <textarea
              aria-label="Edit comment"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={3}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={updating || !body.trim()}
                className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground disabled:opacity-50"
              >
                {updating ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-md border px-3 py-1.5 text-xs"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <p className="whitespace-pre-wrap text-sm">{comment.body}</p>
        )}
        {own && !editing && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Edit
            </button>
            <ConfirmDialog
              trigger={
                <button type="button" className="text-xs text-destructive">
                  Delete
                </button>
              }
              title="Delete this comment?"
              description="The comment disappears for everyone on this task."
              confirmLabel="Delete comment"
              destructive
              onConfirm={onDelete}
            />
          </div>
        )}
      </div>
    </li>
  );
}

/**
 * No user-lookup endpoint exists for comment authors, so an actor id stands in
 * for a name: initials in the avatar and a shortened id as the display label.
 */
function actorInitials(actorId: string) {
  return actorId
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 2)
    .toUpperCase();
}

function actorLabel(actorId: string) {
  return actorId.length > 14 ? `${actorId.slice(0, 14)}…` : actorId;
}
