import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { io } from "socket.io-client";
import {
  IconCircleFilled,
  IconHash,
  IconMessageCircle,
  IconMoodSmile,
  IconPlus,
  IconSend,
} from "@tabler/icons-react";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/workspace-ui";
import { AppDialog } from "@/components/app-dialog";
import { ResourceState } from "@/components/resource-state";
import { api, apiOrigin, organizationPath, useApiResource } from "@/lib/api";

type Channel = {
  id: string;
  name: string;
  kind: "channel" | "direct";
  isPrivate: boolean;
};
type Member = { id: string; user?: { name?: string; email?: string } };
type Reaction = { emoji: string; memberId: string };
type Message = {
  id: string;
  content: string;
  senderId: string;
  senderKind: string;
  createdAt: string;
  threadRootId: string | null;
  reactions: Reaction[];
};

export const Route = createFileRoute("/$tenant/chat")({ component: Chat });

function Chat() {
  const { tenant } = useParams({ strict: false }) as { tenant: string };
  const channels = useApiResource<Channel[]>(
    organizationPath(tenant, "/channels"),
  );
  const [channelId, setChannelId] = useState("");
  const messages = useApiResource<Message[]>(
    channelId
      ? organizationPath(tenant, `/channels/${channelId}/messages`)
      : null,
  );
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [channelKind, setChannelKind] = useState<"channel" | "direct">("channel");
  const [threadRoot, setThreadRoot] = useState<Message | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [threadMessage, setThreadMessage] = useState("");
  const [joined, setJoined] = useState(false);
  const members = useApiResource<Member[]>(organizationPath(tenant, "/members"));
  const thread = useApiResource<Message[]>(
    threadRoot && channelId
      ? organizationPath(
          tenant,
          `/channels/${channelId}/messages/${threadRoot.id}/thread`,
        )
      : null,
  );
  useEffect(() => {
    if (!channelId && channels.data?.[0]) setChannelId(channels.data[0].id);
  }, [channelId, channels.data]);
  useEffect(() => {
    if (!tenant) return;
    const socket = io(`${apiOrigin}/chat`, {
      withCredentials: true,
      auth: { organizationId: tenant },
    });
    socket.on("message.created", (event: { channelId: string }) => {
      if (event.channelId === channelId) void messages.reload();
    });
    return () => {
      socket.close();
    };
  }, [tenant, channelId, messages.reload]);
  const activeChannel = channels.data?.find(
    (channel) => channel.id === channelId,
  );

  async function send(event?: FormEvent, threadRootId?: string) {
    event?.preventDefault();
    if (!message.trim() || !channelId) return;
    setSubmitting(true);
    setError("");
    try {
      await api<Message>(
        organizationPath(tenant, `/channels/${channelId}/messages`),
        { method: "POST", body: JSON.stringify({ content: message.trim(), threadRootId }) },
      );
      setMessage("");
      await messages.reload();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to send message",
      );
    } finally {
      setSubmitting(false);
    }
  }
  async function sendThread(event: FormEvent) {
    event.preventDefault();
    if (!threadMessage.trim() || !threadRoot) return;
    setSubmitting(true);
    try {
      await api<Message>(organizationPath(tenant, `/channels/${channelId}/messages`), { method: "POST", body: JSON.stringify({ content: threadMessage.trim(), threadRootId: threadRoot.id }) });
      setThreadMessage("");
      await Promise.all([thread.reload(), messages.reload()]);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to reply to thread"); } finally { setSubmitting(false); }
  }
  async function react(item: Message, emoji: string) {
    try {
      await api(
        organizationPath(
          tenant,
          `/channels/${channelId}/messages/${item.id}/reactions`,
        ),
        { method: "POST", body: JSON.stringify({ emoji }) },
      );
      await messages.reload();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to save reaction",
      );
    }
  }
  async function createChannel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setError("");
    try {
      const created = await api<Channel>(
        organizationPath(tenant, "/channels"),
        {
          method: "POST",
          body: JSON.stringify({
            name: String(form.get("name")),
            kind: channelKind,
            isPrivate: form.get("private") === "on",
            memberIds: channelKind === "direct" ? [String(form.get("memberId"))].filter(Boolean) : [],
          }),
        },
      );
      setChannelId(created.id);
      setCreating(false);
      await channels.reload();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to create channel",
      );
    } finally {
      setSubmitting(false);
    }
  }
  async function toggleMembership() { if (!channelId) return; try { await api(organizationPath(tenant, `/channels/${channelId}/${joined ? "leave" : "join"}`), { method: joined ? "DELETE" : "POST" }); setJoined((value) => !value); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to update channel membership"); } }

  return (
    <>
      <PageHeader
        title="Buzz Chat"
        description="Conversations are stored with the workspace and update in real time for channel members."
        action={
          <button
            onClick={() => { setChannelKind("channel"); setCreating(true); }}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-violet-600 px-3 text-sm font-semibold text-white"
          >
            <IconPlus className="size-4" />
            New channel
          </button>
        }
      />
      <section className="surface grid min-h-[38rem] overflow-hidden rounded-2xl lg:grid-cols-[15rem_1fr]">
        <aside className="border-b bg-muted/30 p-4 lg:border-r lg:border-b-0">
          <div className="mb-2 flex items-center justify-between"><p className="eyebrow">Channels</p><span className="flex items-center gap-1 text-[0.625rem] font-semibold text-emerald-700"><IconCircleFilled className="size-2" />Live</span></div>
          <ResourceState
            loading={channels.loading}
            error={channels.error}
            onRetry={channels.reload}
            isEmpty={channels.data?.length === 0}
            emptyTitle="No channels yet"
          >
            {channels.data && (
              <nav className="space-y-1">
                {channels.data.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => setChannelId(channel.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm ${channel.id === channelId ? "bg-white font-semibold text-violet-700 shadow-sm" : "text-muted-foreground hover:bg-white"}`}
                  >
                    <IconHash className="size-3.5" />
                    {channel.kind === "direct" ? "↗ " : ""}{channel.name}
                    {channel.isPrivate && (
                      <span className="ml-auto text-[0.65rem]">Private</span>
                    )}
                  </button>
                ))}
              </nav>
            )}
          </ResourceState>
          <div className="mt-4 flex gap-3">
          <button
            onClick={() => { setChannelKind("channel"); setCreating(true); }}
            className="mt-4 flex items-center gap-1 text-sm font-semibold text-violet-700"
          >
            <IconPlus className="size-4" />
            Create a channel
          </button>
          <button onClick={() => { setChannelKind("direct"); setCreating(true); }} className="flex items-center gap-1 text-sm font-semibold text-violet-700"><IconMessageCircle className="size-4" />New DM</button>
          </div>
        </aside>
        <div className="flex min-w-0 flex-col">
          <div className="border-b px-5 py-4">
            <div className="flex items-center gap-2">
              {activeChannel?.kind === "direct" ? <IconMessageCircle className="size-5 text-violet-600" /> : <IconHash className="size-5 text-violet-600" />}
              <h2 className="font-semibold">
                {activeChannel?.name ?? "Choose a channel"}
              </h2>
              {activeChannel?.isPrivate && (
                <StatusPill tone="amber">Private</StatusPill>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {activeChannel?.kind === "direct" ? "Private conversation for its selected members." : "Messages are live for people with workspace access."}
            </p>
            {activeChannel?.kind !== "direct" && <button onClick={() => void toggleMembership()} className="mt-2 text-xs font-semibold text-violet-700">{joined ? "Leave channel" : "Join channel"}</button>}
          </div>
          <div className="flex-1 p-5">
            <ResourceState
              loading={messages.loading}
              error={messages.error}
              onRetry={messages.reload}
              isEmpty={Boolean(channelId && messages.data?.length === 0)}
              emptyTitle="Start the conversation"
              emptyCopy="Send the first message to this channel."
            >
              {messages.data && (
                <div className="space-y-5">
                  {messages.data.map((item) => (
                    <article
                      key={item.id}
                      className="group rounded-xl p-2 hover:bg-muted/45"
                    >
                      <div className="flex items-center gap-2">
                        <span className="grid size-7 place-items-center rounded-full bg-violet-100 text-[0.6rem] font-bold text-violet-700">
                          {item.senderKind === "agent" ? "AI" : "TM"}
                        </span>
                        <strong className="text-sm">
                          {item.senderKind === "agent"
                            ? "Teamlyf agent"
                            : "Teammate"}
                        </strong>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="ml-9 mt-1 text-sm leading-6 text-slate-600">
                        {item.content}
                      </p>
                      <div className="ml-9 mt-2 flex flex-wrap gap-1">
                        {["💜", "👍", "🎉", "👀"].map((emoji) => <button key={emoji} onClick={() => void react(item, emoji)} className="rounded-md border bg-white px-1.5 py-0.5 text-xs">{emoji} {item.reactions.filter((reaction) => reaction.emoji === emoji).length || ""}</button>)}
                        <button
                          onClick={() => setThreadRoot(item)}
                          className="rounded-md border bg-white px-1.5 py-0.5 text-xs"
                        >
                          <IconMessageCircle className="inline size-3" /> Thread
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </ResourceState>
          </div>
          <form
            onSubmit={send}
            className="m-4 flex items-center gap-2 rounded-xl border bg-white p-2 shadow-sm"
          >
            <IconMoodSmile className="ml-1 size-4 text-muted-foreground" />
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={
                channelId
                  ? `Message #${activeChannel?.name}`
                  : "Choose a channel"
              }
              disabled={!channelId || submitting}
              className="min-w-0 flex-1 bg-transparent px-1 text-sm outline-none"
            />
            <button
              disabled={!channelId || submitting}
              aria-label="Send message"
              className="grid size-8 place-items-center rounded-lg bg-violet-600 text-white disabled:opacity-50"
            >
              <IconSend className="size-4" />
            </button>
          </form>
          {error && <p className="px-5 pb-3 text-sm text-rose-700">{error}</p>}
        </div>
      </section>
      {creating && (
        <AppDialog
          title={channelKind === "direct" ? "Start a direct message" : "Create a channel"}
          description={channelKind === "direct" ? "Choose a teammate for a private conversation." : "Channels hold their messages, threads, reactions, and member access."}
          onClose={() => setCreating(false)}
        >
          <form onSubmit={createChannel} className="space-y-4">
            <label className="block text-sm font-semibold">
              {channelKind === "direct" ? "Conversation name" : "Channel name"}
              <input
                name="name"
                required
                placeholder="e.g. beta-feedback"
                className="mt-1.5 h-10 w-full rounded-xl border px-3 text-sm"
              />
            </label>
            {channelKind === "direct" && <label className="block text-sm font-semibold">Teammate<select name="memberId" required className="mt-1.5 h-10 w-full rounded-xl border bg-white px-3 text-sm"><option value="">Choose a teammate</option>{members.data?.map((member) => <option key={member.id} value={member.id}>{member.user?.name ?? member.user?.email ?? "Teammate"}</option>)}</select></label>}
            {channelKind === "channel" && <label className="flex items-center gap-2 text-sm font-semibold">
              <input name="private" type="checkbox" />
              Private channel
            </label>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="px-3 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={submitting}
                className="rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white"
              >
                {submitting ? "Creating…" : "Create channel"}
              </button>
            </div>
            {error && <p className="text-sm text-rose-700">{error}</p>}
          </form>
        </AppDialog>
      )}
      {threadRoot && (
        <AppDialog
          title="Thread"
          description={threadRoot.content}
          onClose={() => setThreadRoot(null)}
        >
          <ResourceState
            loading={thread.loading}
            error={thread.error}
            onRetry={thread.reload}
            isEmpty={thread.data?.length === 0}
            emptyTitle="No replies yet"
          >
            {thread.data && (
              <div className="space-y-3">
                {thread.data.map((item) => (
                  <p
                    key={item.id}
                    className="rounded-xl bg-muted/50 p-3 text-sm"
                  >
                    {item.content}
                  </p>
                ))}
              </div>
            )}
          </ResourceState>
          <form onSubmit={sendThread} className="mt-4 flex gap-2 rounded-lg border bg-white p-2"><input value={threadMessage} onChange={(event) => setThreadMessage(event.target.value)} placeholder="Reply in thread" className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none" /><button disabled={submitting} className="rounded-md bg-violet-600 px-3 text-xs font-semibold text-white">Reply</button></form>
        </AppDialog>
      )}
    </>
  );
}
