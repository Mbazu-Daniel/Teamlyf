import { IconBell, IconCheck, IconCircleCheck } from "@tabler/icons-react";
import { useState } from "react";

type Notification = { id: string; title: string; body: string; time: string; read: boolean };

const initial: Notification[] = [
  { id: "1", title: "Notifications are ready", body: "Your workspace activity will appear here.", time: "Just now", read: false },
  { id: "2", title: "Stay on top of your work", body: "Task, project and team updates will be shown in this inbox.", time: "Today", read: true },
];

export function NotificationsPage() {
  const [items, setItems] = useState(initial);
  const unread = items.filter((item) => !item.read).length;
  return <div className="mx-auto flex h-full w-full max-w-4xl flex-col p-5 sm:p-8">
    <header className="flex items-center justify-between border-b pb-5"><div><div className="flex items-center gap-2"><IconBell className="size-5"/><h1 className="text-2xl font-semibold">Notifications</h1>{unread > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">{unread}</span>}</div><p className="mt-1 text-sm text-muted-foreground">Updates and activity from your organization.</p></div><button onClick={() => setItems(items.map((item) => ({ ...item, read: true })))} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted"><IconCheck className="size-4"/> Mark all read</button></header>
    <div className="divide-y">{items.map((item) => <button key={item.id} onClick={() => setItems(items.map((current) => current.id === item.id ? { ...current, read: true } : current))} className={`flex w-full gap-4 p-5 text-left hover:bg-muted/40 ${item.read ? "" : "bg-primary/5"}`}><div className={`mt-1 grid size-9 shrink-0 place-items-center rounded-full ${item.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}><IconCircleCheck className="size-4"/></div><div className="min-w-0 flex-1"><div className="flex justify-between gap-4"><p className="font-medium">{item.title}</p><span className="shrink-0 text-xs text-muted-foreground">{item.time}</span></div><p className="mt-1 text-sm text-muted-foreground">{item.body}</p></div></button>)}</div>
  </div>;
}