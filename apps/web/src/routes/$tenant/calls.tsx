import { useState, type FormEvent } from "react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { IconPhone, IconVideo, IconUsers } from "@tabler/icons-react";
import { PageHeader } from "@/components/page-header";
import { AppDialog } from "@/components/app-dialog";
import { api, organizationPath } from "@/lib/api";

export const Route = createFileRoute("/$tenant/calls")({ component: Calls });

function Calls() {
  const { tenant } = useParams({ strict: false }) as { tenant: string };
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const result = await api<{ roomName: string; token?: string }>(organizationPath(tenant, "/calls/token"), { method: "POST", body: JSON.stringify({ roomName: String(form.get("roomName")), participantName: String(form.get("participantName")) }) });
      setMessage(`Room “${result.roomName}” is ready. Your provider token was issued securely.`);
      setOpen(false);
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : "Unable to start call"); } finally { setBusy(false); }
  }
  return <><PageHeader title="Calls" description="Create a secure audio or video room for a channel, project review, or ad-hoc meeting." action={<button onClick={() => setOpen(true)} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-violet-600 px-3 text-sm font-semibold text-white"><IconVideo className="size-4" />Start a call</button>} /><section className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><article className="surface rounded-2xl p-6"><span className="grid size-11 place-items-center rounded-xl bg-violet-100 text-violet-700"><IconPhone className="size-5" /></span><h2 className="mt-5 text-xl font-semibold">Meet where the work happens</h2><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Calls are tenant-scoped and use a short-lived provider token. Share the room name only with the teammates who should join.</p><button onClick={() => setOpen(true)} className="mt-6 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white">Create a room</button></article><aside className="surface rounded-2xl p-6"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-sky-100 text-sky-700"><IconUsers className="size-4" /></span><div><h2 className="font-semibold">Secure by workspace</h2><p className="text-xs text-muted-foreground">Only active members can request a room token.</p></div></div><div className="mt-6 rounded-xl bg-muted p-4 text-sm text-muted-foreground">Connect your LiveKit-compatible provider credentials on the API to enable the embedded call experience.</div></aside></section>{message && <p className="mt-5 rounded-lg bg-violet-50 p-3 text-sm text-violet-800">{message}</p>}{open && <AppDialog title="Start a call" description="A room token is issued only for the selected workspace." onClose={() => setOpen(false)}><form onSubmit={start} className="space-y-4"><label className="block text-sm font-semibold">Room name<input name="roomName" required placeholder="e.g. sprint-review" className="mt-1.5 h-10 w-full rounded-xl border px-3 text-sm" /></label><label className="block text-sm font-semibold">Your display name<input name="participantName" required placeholder="Your name" className="mt-1.5 h-10 w-full rounded-xl border px-3 text-sm" /></label><button disabled={busy} className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white">{busy ? "Creating room…" : "Create secure room"}</button></form></AppDialog>}</>;
}
