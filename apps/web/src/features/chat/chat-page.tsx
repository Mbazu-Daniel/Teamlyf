import { useEffect, useMemo, useState } from "react";
import { IconHash, IconLock, IconPlus, IconMessageCircle, IconSend, IconX, IconMessage2, IconUsers } from "@tabler/icons-react";
import { client } from "@/lib/api";
import { useOrganization } from "@/lib/organization";

type Channel = {
  id: string;
  name: string;
  kind?: "channel" | "direct";
  isPrivate?: boolean;
};

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

export function ChatPage() {
  const { organization } = useOrganization();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [thread, setThread] = useState<Message | null>(null);
  const [threadMessages, setThreadMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [threadDraft, setThreadDraft] = useState("");
  const [newChannel, setNewChannel] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [mobileChannels, setMobileChannels] = useState(false);

  const orgId = organization?.id;

  async function loadChannels() {
    if (!orgId) return;
    setLoading(true);
    try {
      const data = await client.request<Channel[]>(`/organization/${orgId}/channels`);
      setChannels(data);
      setActiveChannel((current) => current && data.some((item) => item.id === current.id) ? current : data[0] ?? null);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(channelId: string) {
    if (!orgId) return;
    const data = await client.request<Message[]>(`/organization/${orgId}/channels/${channelId}/messages`);
    setMessages(data);
  }

  useEffect(() => {
    void loadChannels();
  }, [orgId]);

  useEffect(() => {
    if (activeChannel) void loadMessages(activeChannel.id);
    else setMessages([]);
    setThread(null);
  }, [activeChannel?.id]);

  async function createChannel() {
    const name = newChannel.trim();
    if (!orgId || !name) return;
    const created = await client.request<Channel>(`/organization/${orgId}/channels`, {
      method: "POST",
      body: JSON.stringify({ name, kind: "channel" }),
    });
    setNewChannel("");
    setShowCreate(false);
    setChannels((current) => [...current, created]);
    setActiveChannel(created);
  }

  async function sendMessage() {
    if (!orgId || !activeChannel || !draft.trim() || sending) return;
    setSending(true);
    const content = draft.trim();
    setDraft("");
    try {
      const created = await client.request<Message>(
        `/organization/${orgId}/channels/${activeChannel.id}/messages`,
        { method: "POST", body: JSON.stringify({ content }) },
      );
      setMessages((current) => [...current, created]);
    } finally {
      setSending(false);
    }
  }

  async function openThread(message: Message) {
    if (!orgId || !activeChannel) return;
    const data = await client.request<Message[]>(
      `/organization/${orgId}/channels/${activeChannel.id}/messages/${message.id}/thread`,
    );
    setThread(message);
    setThreadMessages(data.slice(1));
  }

  async function sendThreadReply() {
    if (!orgId || !activeChannel || !thread || !threadDraft.trim()) return;
    const content = threadDraft.trim();
    setThreadDraft("");
    const created = await client.request<Message>(
      `/organization/${orgId}/channels/${activeChannel.id}/messages`,
      { method: "POST", body: JSON.stringify({ content, threadRootId: thread.id }) },
    );
    setThreadMessages((current) => [...current, created]);
  }

  async function toggleReaction(message: Message, emoji: string) {
    if (!orgId || !activeChannel) return;
    const reacted = message.reactions?.some((item) => item.emoji === emoji);
    if (reacted) {
      await client.request(
        `/organization/${orgId}/channels/${activeChannel.id}/messages/${message.id}/reactions?emoji=${encodeURIComponent(emoji)}`,
        { method: "DELETE" },
      );
    } else {
      await client.request(
        `/organization/${orgId}/channels/${activeChannel.id}/messages/${message.id}/reactions`,
        { method: "POST", body: JSON.stringify({ emoji }) },
      );
    }
    await loadMessages(activeChannel.id);
  }

  const visibleMessages = useMemo(() => messages.filter((message) => !message.threadRootId), [messages]);

  return (
    <div className="flex h-full min-h-0 w-full bg-[var(--app-page-background)] p-3 md:p-4">
      <div className="mx-auto flex min-h-0 w-full max-w-[1440px] overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <aside className="hidden w-[250px] shrink-0 flex-col border-r bg-background md:flex">
          <div className="flex h-14 items-center justify-between border-b px-4">
            <div>
              <p className="text-sm font-semibold">Chat</p>
              <p className="text-[10px] text-muted-foreground">{organization?.name}</p>
            </div>
            <button onClick={() => setShowCreate((value) => !value)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Create channel">
              <IconPlus className="size-4" />
            </button>
          </div>
          {showCreate && (
            <div className="border-b p-3">
              <input autoFocus value={newChannel} onChange={(event) => setNewChannel(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void createChannel()} placeholder="Channel name" className="h-8 w-full rounded-md border bg-background px-2 text-xs outline-none focus:border-primary" />
              <button onClick={() => void createChannel()} className="mt-2 h-8 w-full rounded-md bg-primary text-xs font-semibold text-primary-foreground">Create channel</button>
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            <p className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Channels</p>
            {loading ? (
              <div className="space-y-2 p-2">{[1,2,3,4].map((item) => <div key={item} className="h-8 animate-pulse rounded-md bg-muted" />)}</div>
            ) : channels.length === 0 ? (
              <div className="px-2 py-6 text-center text-xs text-muted-foreground">No channels yet.</div>
            ) : channels.map((channel) => (
              <button key={channel.id} onClick={() => setActiveChannel(channel)} className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs transition ${activeChannel?.id === channel.id ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                {channel.isPrivate ? <IconLock className="size-3.5 shrink-0" /> : <IconHash className="size-3.5 shrink-0" />}
                <span className="truncate">{channel.name}</span>
              </button>
            ))}
          </div>
        </aside>

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
                <div className="flex min-w-0 items-center gap-2"><button type="button" className="rounded-md p-1.5 hover:bg-muted md:hidden" onClick={() => setMobileChannels(true)} aria-label="Open channels"><IconHash className="size-4" /></button><div className="min-w-0">
                  <div className="flex items-center gap-2"><IconHash className="size-4 text-muted-foreground" /><h1 className="truncate text-sm font-semibold">{activeChannel.name}</h1></div>
                  <p className="ml-6 text-[10px] text-muted-foreground">Team channel</p>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <button className="rounded-md p-1.5 hover:bg-muted" aria-label="Members"><IconUsers className="size-4" /></button>
                </div>
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
                                    return <button key={emoji} onClick={() => void toggleReaction(message, emoji)} className="rounded-full border border-border bg-background px-1.5 py-0.5 text-[10px] hover:border-primary/40 hover:bg-primary/5">{emoji}{count ? ` ${count}` : ""}</button>;
                                  })}
                                  <button onClick={() => void openThread(message)} className="rounded-md px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground">Reply</button>
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
                      <div className="flex items-center justify-end"><button disabled={!draft.trim() || sending} onClick={() => void sendMessage()} className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground disabled:opacity-40" aria-label="Send message"><IconSend className="size-4" /></button></div>
                    </div>
                  </div>
                </section>

                {thread && (
                  <aside className="hidden w-[360px] shrink-0 flex-col border-l bg-background lg:flex">
                    <div className="flex h-14 items-center justify-between border-b px-4"><div><p className="text-sm font-semibold">Thread</p><p className="text-[10px] text-muted-foreground">{threadMessages.length} replies</p></div><button onClick={() => setThread(null)} className="rounded-md p-1.5 hover:bg-muted" aria-label="Close thread"><IconX className="size-4" /></button></div>
                    <div className="min-h-0 flex-1 overflow-y-auto p-3">
                      <div className="rounded-lg border-l-2 border-primary bg-primary/5 p-3"><p className="text-xs font-medium">{thread.content}</p></div>
                      <div className="my-3 h-px bg-border" />
                      <div className="space-y-2">{threadMessages.map((reply) => <div key={reply.id} className="rounded-lg bg-muted/40 p-2.5"><p className="text-[10px] font-semibold">{reply.senderId ? initials(reply.senderId) : "Team member"}</p><p className="mt-1 whitespace-pre-wrap text-xs">{reply.content}</p></div>)}</div>
                    </div>
                    <div className="border-t p-3"><div className="flex gap-2 rounded-lg border p-2"><input value={threadDraft} onChange={(event) => setThreadDraft(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void sendThreadReply()} placeholder="Reply to thread…" className="min-w-0 flex-1 bg-transparent text-xs outline-none" /><button onClick={() => void sendThreadReply()} className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"><IconSend className="size-3.5" /></button></div></div>
                  </aside>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
