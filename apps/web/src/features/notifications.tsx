import { IconBell, IconExternalLink } from "@tabler/icons-react";

export function NotificationsPage() {
  return (
    <div className="mx-auto flex h-full w-full max-w-[960px] flex-col gap-5 overflow-y-auto p-4 md:p-8">
      <section className="rounded-[16px] border bg-white/90 p-6 shadow-sm dark:bg-card">
        <div className="flex items-center gap-2">
          <IconBell className="size-5 text-primary" />
          <h1 className="text-2xl font-semibold">Notifications</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Organization notifications will appear here when notification persistence is connected.
        </p>
      </section>
      <section className="rounded-[16px] border bg-card p-8 text-center shadow-sm">
        <IconExternalLink className="mx-auto size-8 text-muted-foreground/50" />
        <h2 className="mt-4 text-lg font-semibold">Notifications are not connected yet</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
          This page is intentionally a placeholder rather than showing sample notifications that could look like real organization activity.
        </p>
      </section>
    </div>
  );
}
