import { useEffect, useMemo, useRef, useState } from "react";
import { IconHash, IconLock, IconPlus, IconMessageCircle, IconSend, IconX, IconMessage2, IconUsers } from "@tabler/icons-react";
import { client, getSession, settingsApi } from "@/lib/api";
import type { Organization } from "@/lib/api";

type Channel = { id: string; name: string; kind?: "channel" | "direct"; isPrivate?: boolean };
type Reaction = { messageId: string; memberId: string; emoji: string };
type Message = {
  id: string;
  content: string;
  senderId?: string | null;
  senderKind?: string;
  sender?: { id: string; firstName: string | null; lastName: string | null } | null;
  createdAt: string;
  updatedAt?: string;
  threadRootId?: string | null;
  reactions?: Reaction[];
};

function initials(id: string) {
  return id.slice(0, 2).toUpperCase();
}

export function ChatPage({ organization }: { organization: Organization }) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [thread, setThread] = useState<Message | null>(null);
  const [threadMessages, setThreadMessages] = useState<Message[]>([]);
  const [threadCursor, setThreadCursor] = useState<string>();
  const [threadLoading, setThreadLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [threadDraft, setThreadDraft] = useState("");
  const [newChannel, setNewChannel] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [mobileChannels, setMobileChannels] = useState(false);
  const [currentMemberId, setCurrentMemberId] = useState<string>();
  const requestVersion = useRef(0);

  const orgId = organization.id;

  async function loadChannels() {
    const version = ++requestVersion.current;
    setLoading(true);
    try {
      const data = await client.request<Channel[]>(`/organization/${orgId}/channels`);
      if (requestVersion.current !== version) return;
      setChannels(data);
      setActiveChannel((current) => current && data.some((item) => item.id === current.id) ? current : data[0] ?? null);
    } finally {
      if (requestVersion.current === version) setLoading(false);
    }
  }

  async function loadCurrentMember() {
    try {
      const session = await getSession();
      const members = await settingsApi.members(orgId);
      const member = members.members.find((item) => item.userId === session?.user?.id);
      setCurrentMemberId(member?.id);
    } catch {
      setCurrentMemberId(undefined);
    }
  }

  async function loadMessages(channelId: string) {
    const version = ++requestVersion.current;
    const data = await client.request<Message[]>(`/organization/${orgId}/channels/${channelId}/messages`);
    if (requestVersion.current === version && activeChannel?.id === channelId) setMessages(data);
  }

  useEffect(() => {
    void Promise.all([loadChannels(), loadCurrentMember()]);
  }, [orgId]);

  useEffect(() => {
    if (!activeChannel) {
      setMessages([]);
      setThread(null);
      return;
    }
    setMessages([]);
    setThread(null);
    setThreadMessages([]);
    setThreadCursor(undefined);
    void loadMessages(activeChannel.id);
  }, [activeChannel?.id]);

  async function createChannel() {
    const name = newChannel.trim();
    if (!name) return;
    const created = await client.request<Channel>(`/organization/${orgId}/channels`, {
      method: "POST",
      body: JSON.stringify({ name, kind: "channel" }),
    });
    setNewChannel("");
    setShowCreate(false);
    setMobileChannels(false);
    setChannels((current) => [...current, created]);
    setActiveChannel(created);
  }

  async function sendMessage() {
    if (!activeChannel || !draft.trim() || sending) return;
    setSending(true);
    const content = draft.trim();
    const channelId = activeChannel.id;
    try {
      const created = await client.request<Message>(
        `/organization/${orgId}/channels/${channelId}/messages`,
        { method: "POST", body: JSON.stringify({ content }) },
      );
      if (activeChannel?.id === channelId) {
        setMessages((current) => [...current, created]);
        setDraft((current) => current === content ? "" : current);
      }
    } finally {
      setSending(false);
    }
  }

  async function openThread(message: Message) {
    const channelId = activeChannel?.id;
    if (!channelId) return;
    const data = await client.request<Message[]>(
      `/organization/${orgId}/channels/${channelId}/messages/${message.id}/thread`,
    );
    if (activeChannel?.id !== channelId) return;
    setThread(message);
    setThreadMessages(data.slice(1));
    setThreadCursor(data.length > 1 ? data[1].createdAt : undefined);
  }

  async function loadOlderThreadReplies() {
    if (!thread || !activeChannel || !threadCursor || threadLoading) return;
    const channelId = activeChannel.id;
    setThreadLoading(true);
    try {
      const data = await client.request<Message[]>(
        `/organization/${orgId}/channels/${channelId}/messages/${thread.id}/thread`,
        { query: { cursor: threadCursor } },
      );
      if (activeChannel?.id !== channelId || !thread) return;
      const older = data.slice(1);
      setThreadMessages((current) => [...older, ...current]);
      setThreadCursor(older.length ? older[0].createdAt : undefined);
    } finally {
      setThreadLoading(false);
    }
  }

  async function sendThreadReply() {
    if (!activeChannel || !thread || !threadDraft.trim()) return;
    const channelId = activeChannel.id;
    const rootId = thread.id;
    const content = threadDraft.trim();
    const created = await client.request<Message>(
      `/organization/${orgId}/channels/${channelId}/messages`,
      { method: "POST", body: JSON.stringify({ content, threadRootId: rootId }) },
    );
    if (activeChannel?.id === channelId && thread?.id === rootId) {
      setThreadMessages((current) => [...current, created]);
      setThreadDraft((current) => current === content ? "" : current);
    }
  }

  async function toggleReaction(message: Message, emoji: string) {
    if (!activeChannel) return;
    const channelId = activeChannel.id;
    const reacted = currentMemberId
      ? message.reactions?.some((item) => item.emoji === emoji && item.memberId === currentMemberId) === true
      : false;
    const path = `/organization/${orgId}/channels/${channelId}/messages/${message.id}/reactions`;
    if (reacted) {
      await client.request(path, { method: "DELETE", query: { emoji } });
    } else {
      await client.request(path, { method: "POST", body: JSON.stringify({ emoji }) });
    }
    if (activeChannel?.id === channelId) await loadMessages(channelId);
  }

  const visibleMessages = useMemo(() => messages.filter((message) => !message.threadRootId), [messages]);

  return (
    <div className="flex h-full min-h-0 w-full bg-[var(--app-page-background)] p-3 md:p-4">
      <div className="mx-auto flex min-h-0 w-full max-w-[1440px] overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <aside className="hidden w-[250px] shrink-0 flex-col border-r bg-background md:flex">
          <ChannelSidebar
            channels={channels}
            activeChannel={activeChannel}
            loading={loading}
            showCreate={showCreate}
            newChannel={newChannel}
            setNewChannel={setNewChannel}
            setShowCreate={setShowCreate}
            onCreate={createChannel}
            onSelect={setActiveChannel}
          />
        </aside>

        {mobileChannels && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button type="button" aria-label="Close channels" className="absolute inset-0 bg-black/30" onClick={() => setMobileChannels(false)} />
            <aside className="relative flex h-full w-[280px] flex-col border-r bg-background shadow-xl">
              <ChannelSidebar
                channels={channels}
                activeChannel={activeChannel}
                loading={loading}
                showCreate={showCreate}
                newChannel={newChannel}
                setNewChannel={setNewChannel}
                setShowCreate={setShowCreate}
                onCreate={createChannel}
                onSelect={(channel) => { setActiveChannel(channel); setMobileChannels(false); }}
              />
            </aside>
          </div>
        )}

        <main className="flex min-w-0 flex-1 flex-col bg-background">
          {!activeChannel ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10"><IconMessageCircle className="size-6 text-primary" /></div>
              <h2 className="text-sm font-semibold">Select a channel</h2>
              <p className="max-w-xs text-xs text-muted-foreground">Choose a channel from the chat sidebar to start a conversation.</p>
            </div>
          ) : (
            <>
              <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
                <div className="flex min-w-0 items-center gap-2">
                  <button type="button" className="rounded-md p-1.5 hover:bg-muted md:hidden" onClick={() => setMobileChannels(true)} aria-label="Open channels"><IconHash className="size-4" /></button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2"><IconHash className="size-4 text-muted-foreground" /><h1 className="truncate text-sm font-semibold">{activeChannel.name}</h1></div>
                    <p className="ml-6 text-[10px] text-muted-foreground">Team channel</p>
                  </div>
                </div>
                <button type="button" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted" aria-label="Channel members"><IconUsers className="size-4" /></button>
              </header>

              <div className="flex min-h-0 flex-1">
                <section className="flex min-w-0 flex-1 flex-col">
                  <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
                    {visibleMessages.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                        <div className="flex size-12 items-center justify-center rounded-xl bg-muted"><IconMessage2 className="size-5 text-muted-foreground" /></div>
                        <p className="text-sm font-medium">No messages yet</p>
                        <p className="text-xs text-muted-foreground">Start the conversation in #{activeChannel.name}.</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {visibleMessages.map((message) => (
                          <article key={message.id} className="group relative rounded-lg px-2 py-2 hover:bg-muted/50">
                            <div className="flex gap-3">
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">{message.sender ? `${message.sender.firstName?.[0] ?? ""}${message.sender.lastName?.[0] ?? ""}`.toUpperCase() || "TM" : initials(message.senderId ?? "tm")}</div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-baseline gap-2"><span className="text-xs font-semibold">{message.sender ? `${message.sender.firstName ?? ""} ${message.sender.lastName ?? ""}`.trim() || "Team member" : "Team member"}</span><time className="text-[10px] text-muted-foreground">{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div>
                                <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p>
                                <div className="mt-1.5 flex items-center gap-1.5">
                                  {["👍", "❤️", "😂"].map((emoji) => {
                                    const count = message.reactions?.filter((reaction) => reaction.emoji === emoji).length ?? 0;
                                    const reacted = currentMemberId ? message.reactions?.some((reaction) => reaction.emoji === emoji && reaction.memberId === currentMemberId) : false;
                                    return <button type="button" key={emoji} onClick={() => void toggleReaction(message, emoji)} className={`rounded-full border px-1.5 py-0.5 text-[10px] hover:border-primary/40 hover:bg-primary/5 ${reacted ? "border-primary bg-primary/10" : "border-border bg-background"}`}>{emoji}{count ? ` ${count}` : ""}</button>;
                                  })}
                                  <button type="button" onClick={() => void openThread(message)} className="rounded-md px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground">Reply</button>
                                </div>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 border-t p-3">
                    <div className="rounded-xl border bg-card p-2 shadow-sm">
                      <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} placeholder={`Message #${activeChannel.name}`} rows={2} className="w-full resize-none bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground" />
                      <div className="flex items-center justify-end"><button type="button" disabled={!draft.trim() || sending} onClick={() => void sendMessage()} className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground disabled:opacity-40" aria-label="Send message"><IconSend className="size-4" /></button></div>
                    </div>
                  </div>
                </section>

                {thread && (
                  <ThreadPanel
                    thread={thread}
                    messages={threadMessages}
                    draft={threadDraft}
                    loading={threadLoading}
                    hasOlder={Boolean(threadCursor)}
                    onDraftChange={setThreadDraft}
                    onReply={sendThreadReply}
                    onLoadOlder={loadOlderThreadReplies}
                    onClose={() => setThread(null)}
                  />
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function ChannelSidebar(props: {
  channels: Channel[];
  activeChannel: Channel | null;
  loading: boolean;
  showCreate: boolean;
  newChannel: string;
  setNewChannel: (value: string) => void;
  setShowCreate: (value: boolean) => void;
  onCreate: () => void;
  onSelect: (channel: Channel) => void;
}) {
  return (
    <>
      <div className="flex h-14 items-center justify-between border-b px-4">
        <div><p className="text-sm font-semibold">Chat</p><p className="text-[10px] text-muted-foreground">Channels</p></div>
        <button type="button" onClick={() => props.setShowCreate(!props.showCreate)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Create channel"><IconPlus className="size-4" /></button>
      </div>
      {props.showCreate && (
        <div className="border-b p-3">
          <input autoFocus value={props.newChannel} onChange={(event) => props.setNewChannel(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void props.onCreate()} placeholder="Channel name" className="h-8 w-full rounded-md border bg-background px-2 text-xs outline-none focus:border-primary" />
          <button type="button" onClick={props.onCreate} className="mt-2 h-8 w-full rounded-md bg-primary text-xs font-semibold text-primary-foreground">Create channel</button>
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <p className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Channels</p>
        {props.loading ? <div className="space-y-2 p-2">{[1,2,3,4].map((item) => <div key={item} className="h-8 animate-pulse rounded-md bg-muted" />)}</div> :
          props.channels.length === 0 ? <div className="px-2 py-6 text-center text-xs text-muted-foreground">No channels yet.</div> :
          props.channels.map((channel) => <button type="button" key={channel.id} onClick={() => props.onSelect(channel)} className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs transition ${props.activeChannel?.id === channel.id ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>{channel.isPrivate ? <IconLock className="size-3.5 shrink-0" /> : <IconHash className="size-3.5 shrink-0" />}<span className="truncate">{channel.name}</span></button>)}
      </div>
    </>
  );
}

function ThreadPanel(props: {
  thread: Message;
  messages: Message[];
  draft: string;
  loading: boolean;
  hasOlder: boolean;
  onDraftChange: (value: string) => void;
  onReply: () => void;
  onLoadOlder: () => void;
  onClose: () => void;
}) {
  return (
    <aside className="fixed inset-0 z-40 flex flex-col bg-background lg:static lg:z-auto lg:w-[360px] lg:shrink-0 lg:border-l">
      <div className="flex h-14 items-center justify-between border-b px-4">
        <div><p className="text-sm font-semibold">Thread</p><p className="text-[10px] text-muted-foreground">{props.messages.length} replies</p></div>
        <button type="button" onClick={props.onClose} className="rounded-md p-1.5 hover:bg-muted" aria-label="Close thread"><IconX className="size-4" /></button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="rounded-lg border-l-2 border-primary bg-primary/5 p-3"><p className="text-xs font-medium">{props.thread.content}</p></div>
        {props.hasOlder && <button type="button" disabled={props.loading} onClick={props.onLoadOlder} className="mt-3 w-full rounded-md border px-3 py-2 text-xs font-medium disabled:opacity-50">{props.loading ? "Loading..." : "Load older replies"}</button>}
        <div className="my-3 h-px bg-border" />
        <div className="space-y-2">{props.messages.map((reply) => <div key={reply.id} className="rounded-lg bg-muted/40 p-2.5"><p className="text-[10px] font-semibold">{reply.senderId ? initials(reply.senderId) : "Team member"}</p><p className="mt-1 whitespace-pre-wrap text-xs">{reply.content}</p></div>)}</div>
      </div>
      <div className="border-t p-3"><div className="flex gap-2 rounded-lg border p-2"><input value={props.draft} onChange={(event) => props.onDraftChange(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void props.onReply()} placeholder="Reply to thread…" className="min-w-0 flex-1 bg-transparent text-xs outline-none" /><button type="button" onClick={props.onReply} className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"><IconSend className="size-3.5" /></button></div></div>
    </aside>
  );
}
