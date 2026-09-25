import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TaskComments } from "@/features/projects";
import type { Comment } from "@/lib/api";
import { countCalls, jsonResponse, stubFetch, stubRoutes } from "./support/query-hooks";
import { renderComponent } from "./support/render-component";

const COMMENTS_URL = "/organization/org-1/projects/p1/tasks/task-1/comments";
const SESSION_URL = "/auth/session";
const SESSION = { user: { id: "user-ada" } };

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

const ownComment: Comment = {
  id: "c-ada",
  taskId: "task-1",
  parentId: null,
  actorId: "user-ada",
  body: "Ready to ship",
  createdAt: minutesAgo(5),
  updatedAt: minutesAgo(5),
};

const otherComment: Comment = {
  id: "c-bob",
  taskId: "task-1",
  parentId: null,
  actorId: "user-bob",
  body: "First pass looks fine",
  createdAt: minutesAgo(30),
  updatedAt: minutesAgo(30),
};

type ThreadOptions = {
  comments: Comment[];
  /** Override the 201 answer, e.g. to make the server reject the comment. */
  onPost?: (body: string) => Response | Promise<Response>;
  /** Override the list answer, e.g. to fail the first read. */
  onGetComments?: () => Response | Promise<Response>;
};

/** Keeps one mutable thread in the stub so refetches see earlier writes. */
function stubThread(options: ThreadOptions) {
  const commentPath = new RegExp(`${COMMENTS_URL}/[^/]+$`);
  const fetchMock = stubRoutes([
    { url: SESSION_URL, respond: () => SESSION },
    { url: COMMENTS_URL, respond: () => options.onGetComments?.() ?? options.comments },
    {
      method: "POST",
      url: COMMENTS_URL,
      respond: (_url, init) => postComment(options, readBody(init)),
    },
    {
      method: "PATCH",
      url: commentPath,
      respond: (url, init) => editComment(options, commentIdOf(url), readBody(init)),
    },
    { method: "DELETE", url: commentPath, respond: (url) => removeComment(options, url) },
  ]);
  return { fetchMock, comments: options.comments };
}

function readBody(init?: RequestInit) {
  return (JSON.parse(String(init?.body)) as { body: string }).body;
}

/** Posting appends, so the next refetch shows the new comment at the top. */
function postComment(options: ThreadOptions, body: string) {
  if (options.onPost) return options.onPost(body);
  const now = new Date().toISOString();
  const created: Comment = {
    ...ownComment,
    id: "c-new",
    body,
    createdAt: now,
    updatedAt: now,
  };
  options.comments.unshift(created);
  return created;
}

function editComment(options: ThreadOptions, commentId: string | null, body: string) {
  const index = indexOfComment(options, commentId);
  const updated: Comment = {
    ...options.comments[index]!,
    body,
    updatedAt: new Date().toISOString(),
  };
  options.comments[index] = updated;
  return updated;
}

function removeComment(options: ThreadOptions, url: string) {
  options.comments.splice(indexOfComment(options, commentIdOf(url)), 1);
  return null;
}

/** One place that reports an id the stub was never given. */
function indexOfComment(options: ThreadOptions, commentId: string | null) {
  const index = options.comments.findIndex((comment) => comment.id === commentId);
  if (index < 0) throw new Error(`Unknown comment: ${commentId}`);
  return index;
}

function commentIdOf(url: string) {
  const marker = `${COMMENTS_URL}/`;
  const start = url.indexOf(marker);
  return start < 0 ? null : url.slice(start + marker.length);
}

function renderComments() {
  return renderComponent(<TaskComments organizationId="org-1" projectId="p1" taskId="task-1" />);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TaskComments", () => {
  it("getComments_whenThreadOpens_showsSkeletonThenNewestFirstAuthorAndTime", async () => {
    let resolveComments: ((response: Response) => void) | undefined;
    const pendingComments = new Promise<Response>((resolve) => {
      resolveComments = resolve;
    });
    stubFetch((url: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      if (url.endsWith(SESSION_URL)) return jsonResponse(SESSION);
      if (method === "GET" && url.endsWith(COMMENTS_URL)) return pendingComments;
      throw new Error(`Unexpected request: ${method} ${url}`);
    });

    const { container } = renderComments();

    expect(container.querySelector('[data-slot="skeleton"]')).toBeInTheDocument();
    expect(screen.queryByText("No comments yet")).not.toBeInTheDocument();

    if (!resolveComments) throw new Error("the comments request never started");
    resolveComments(jsonResponse([ownComment, otherComment]));

    expect(await screen.findByText("Ready to ship")).toBeInTheDocument();
    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Ready to ship");
    expect(rows[1]).toHaveTextContent("First pass looks fine");
    expect(screen.getByText("user-ada")).toBeInTheDocument();
    expect(screen.getByText("user-bob")).toBeInTheDocument();
    expect(screen.getByText("5 minutes ago")).toBeInTheDocument();
    expect(container.querySelector('[data-slot="skeleton"]')).not.toBeInTheDocument();
  });

  it("getComments_whenThreadIsEmpty_showsNoCommentsYet", async () => {
    stubThread({ comments: [] });
    const { container } = renderComments();

    expect(await screen.findByText("No comments yet")).toBeInTheDocument();
    expect(container.querySelector('[data-slot="skeleton"]')).not.toBeInTheDocument();
    expect(screen.getByLabelText("Write a comment")).toBeInTheDocument();
  });

  it("getComments_whenRequestFails_showsMessageAndRetries", async () => {
    let attempts = 0;
    const { fetchMock } = stubThread({
      comments: [ownComment],
      onGetComments: () => {
        attempts += 1;
        return attempts === 1
          ? jsonResponse({ code: "INTERNAL_ERROR", message: "Comments service down" }, 500)
          : jsonResponse([ownComment]);
      },
    });
    renderComments();

    expect(await screen.findByText("Comments service down")).toBeInTheDocument();
    expect(screen.queryByText("No comments yet")).not.toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("Ready to ship")).toBeInTheDocument();
    expect(countCalls(fetchMock, "GET", COMMENTS_URL)).toBe(2);
  });

  it("createComment_whenSubmitted_appendsDraftBeforeServerAnswers_thenRefetchesThread", async () => {
    let resolvePost: ((response: Response) => void) | undefined;
    const pendingPost = new Promise<Response>((resolve) => {
      resolvePost = resolve;
    });
    const { fetchMock, comments } = stubThread({
      comments: [otherComment],
      onPost: () => pendingPost,
    });
    const user = userEvent.setup();
    renderComments();
    await screen.findByText("First pass looks fine");

    await user.type(screen.getByLabelText("Write a comment"), "Ship it");
    await user.click(screen.getByRole("button", { name: "Comment" }));

    const thread = () => within(screen.getByRole("list"));
    await waitFor(() => expect(thread().getByText("Ship it")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Posting..." })).toBeDisabled();

    if (!resolvePost) throw new Error("the post request never started");
    const now = new Date().toISOString();
    const serverRow: Comment = {
      ...ownComment,
      id: "c-server",
      body: "Ship it",
      createdAt: now,
      updatedAt: now,
    };
    comments.unshift(serverRow);
    resolvePost(jsonResponse(serverRow, 201));

    await waitFor(() => expect(countCalls(fetchMock, "GET", COMMENTS_URL)).toBe(2));
    // The draft is replaced by the server row: exactly one "Ship it" remains.
    await waitFor(() => expect(thread().getAllByText("Ship it")).toHaveLength(1));
    expect(screen.getByLabelText("Write a comment")).toHaveValue("");
  });

  it("createComment_whenServerRejects_rollsBackDraft_andKeepsComposerText", async () => {
    const { fetchMock } = stubThread({
      comments: [otherComment],
      onPost: () =>
        jsonResponse({ code: "VALIDATION_ERROR", message: "Comment body is too long" }, 400),
    });
    const user = userEvent.setup();
    renderComments();
    await screen.findByText("First pass looks fine");

    await user.type(screen.getByLabelText("Write a comment"), "Ship it");
    await user.click(screen.getByRole("button", { name: "Comment" }));

    expect(await screen.findByText("Comment body is too long")).toBeInTheDocument();
    expect(within(screen.getByRole("list")).queryByText("Ship it")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Write a comment")).toHaveValue("Ship it");
    expect(countCalls(fetchMock, "POST", COMMENTS_URL)).toBe(1);
  });

  it("updateComment_whenOwnCommentEdited_sendsPatch_andShowsNewBody", async () => {
    const { fetchMock } = stubThread({ comments: [ownComment, otherComment] });
    const user = userEvent.setup();
    renderComments();
    await screen.findByText("Ready to ship");

    await user.click(screen.getByRole("button", { name: "Edit" }));
    const editor = screen.getByLabelText("Edit comment");
    await user.clear(editor);
    await user.type(editor, "Ship it now");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(within(screen.getByRole("list")).getByText("Ship it now")).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(`${COMMENTS_URL}/c-ada`),
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ body: "Ship it now" }) }),
    );
    expect(countCalls(fetchMock, "GET", COMMENTS_URL)).toBe(2);
  });

  it("deleteComment_whenOwnCommentDeleted_asksForConfirmation_thenRemovesRow", async () => {
    const { fetchMock } = stubThread({ comments: [ownComment, otherComment] });
    const user = userEvent.setup();
    renderComments();
    await screen.findByText("Ready to ship");

    await user.click(screen.getByRole("button", { name: "Delete" }));
    const confirm = await screen.findByRole("dialog", { name: "Delete this comment?" });

    expect(screen.queryByText("Ready to ship")).toBeInTheDocument();
    await user.click(within(confirm).getByRole("button", { name: "Delete comment" }));

    await waitFor(() => expect(screen.queryByText("Ready to ship")).not.toBeInTheDocument());
    expect(screen.getByText("First pass looks fine")).toBeInTheDocument();
    expect(countCalls(fetchMock, "DELETE", `${COMMENTS_URL}/c-ada`)).toBe(1);
  });

  it("editAndDeleteControls_whenCommentBelongsToAnotherActor_areHidden", async () => {
    stubThread({ comments: [otherComment] });
    renderComments();
    await screen.findByText("First pass looks fine");

    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });
});
