import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { client } from "@/lib/api";
import { useOrganization } from "@/lib/organization";

type Channel = { id: string; name: string; kind: "channel" | "direct"; isPrivate: boolean };
type Reaction = { messageId: string; memberId: string; emoji: string };
type Message = {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  threadRootId: string | null;
  reactions: Reaction[];
};

export const Route = createFileRoute("/chat")({ component: ChatPage });
function ChatPage() {
  const { organization } = useOrganization();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelId, setChannelId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [channelName, setChannelName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organization) return;
    void loadChannels();
  }, [organization?.id]);

  useEffect(() => {
    if (!organization || !channelId) return;
    void loadMessages(channelId);
  }, [organization?.id, channelId]);

  async function loadChannels() {
    if (!organization) return;
    try {
      const data = await client.request<Channel[]>(`/organization/${organization.id}/channels`);
      setChannels(data);
      setChannelId((current) => current || data[0]?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load channels");
    }
  }

  async function loadMessages(id: string) {
    if (!organization) return;
    setError(null);
    try {
      setMessages(await client.request<Message[]>(`/organization/${organization.id}/channels/${id}/messages`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load messages");
    }
  }
  async function createChannel(event: React.FormEvent) {
    event.preventDefault();
    if (!organization || !channelName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const channel = await client.request<Channel>(`/organization/${organization.id}/channels`, {
        method: "POST",
        body: JSON.stringify({ name: channelName.trim() }),
      });
      setChannels((current) => [...current, channel]);
      setChannelId(channel.id);
      setChannelName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create channel");
    } finally {
      setLoading(false);
    }
  }
  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    if (!organization || !channelId || !message.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const created = await client.request<Message>(`/organization/${organization.id}/channels/${channelId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: message.trim() }),
      });
      setMessages((current) => [...current, { ...created, reactions: created.reactions ?? [] }]);
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send message");
    } finally {
      setLoading(false);
    }
  }
  async function reactToMessage(messageId: string, emoji: string) {
    if (!organization || !channelId) return;
    try {
      const reaction = await client.request<Reaction>(`/organization/${organization.id}/channels/${channelId}/messages/${messageId}/reactions`, {
        method: "POST",
        body: JSON.stringify({ emoji }),
      });
      setMessages((current) => current.map((item) =>
        item.id === messageId && !item.reactions.some((entry) => entry.memberId === reaction.memberId && entry.emoji === emoji)
          ? { ...item, reactions: [...item.reactions, reaction] }
          : item,
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add reaction");
    }
  }

  if (!organization) {
    return <main className="mx-auto max-w-6xl px-6 py-12"><h1 className="text-2xl font-semibold">Chat</h1><p className="mt-2 text-muted-foreground">Select an organization first.</p></main>;
  }

  const selectedChannel = channels.find((channel) => channel.id === channelId);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
      <header className="flex items-start justify-between gap-6">
        <div><p className="text-sm text-muted-foreground">{organization.name}</p><h1 className="mt-1 text-3xl font-semibold">Chat</h1><p className="mt-2 text-sm text-muted-foreground">Organization channels and conversations.</p></div>
        <a href="/" className="text-sm text-muted-foreground hover:text-foreground">Home</a>
      </header>

      {error && <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}

      <div className="mt-8 grid min-h-[600px] flex-1 overflow-hidden rounded-xl border bg-card md:grid-cols-[240px_1fr]">
        <aside className="border-b p-4 md:border-r md:border-b-0">
          <h2 className="text-sm font-medium">Channels</h2>
          <div className="mt-3 space-y-1">
            {channels.map((channel) => (
              <button key={channel.id} onClick={() => setChannelId(channel.id)} className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm ${channel.id === channelId ? "bg-muted font-medium" : "hover:bg-muted/60"}`}>
                <span className="mr-2 text-muted-foreground">{channel.kind === "direct" ? "@" : "#"}</span>{channel.name}
              </button>
            ))}
            {!channels.length && <p className="py-2 text-xs text-muted-foreground">No channels yet.</p>}
          </div>
          <form onSubmit={createChannel} className="mt-5 space-y-2">
            <input value={channelName} onChange={(e) => setChannelName(e.target.value)} placeholder="New channel" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            <button disabled={loading} className="w-full rounded-md border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50">Create channel</button>
          </form>
        </aside>

        <section className="flex min-h-0 flex-col">
          <div className="border-b px-5 py-4"><h2 className="font-medium">{selectedChannel ? `# ${selectedChannel.name}` : "Select a channel"}</h2>{selectedChannel?.isPrivate && <p className="mt-1 text-xs text-muted-foreground">Private channel</p>}</div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
            {messages.map((item) => (
              <article key={item.id}>
                <p className="text-sm">{item.content}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <time>{new Date(item.createdAt).toLocaleString()}</time>
                  <button onClick={() => void reactToMessage(item.id, "👍")} className="rounded px-1 hover:bg-muted">👍 {item.reactions.filter((reaction) => reaction.emoji === "👍").length || ""}</button>
                  <button onClick={() => void reactToMessage(item.id, "❤️")} className="rounded px-1 hover:bg-muted">❤️ {item.reactions.filter((reaction) => reaction.emoji === "❤️").length || ""}</button>
                </div>
              </article>
            ))}
            {!messages.length && selectedChannel && <p className="py-10 text-center text-sm text-muted-foreground">No messages yet. Start the conversation.</p>}
          </div>
          <form onSubmit={sendMessage} className="border-t p-4">
            <div className="flex gap-2">
              <input value={message} onChange={(e) => setMessage(e.target.value)} disabled={!selectedChannel || loading} placeholder={selectedChannel ? "Write a message..." : "Select a channel"} className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm" />
              <button disabled={!selectedChannel || loading || !message.trim()} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">{loading ? "Sending..." : "Send"}</button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
