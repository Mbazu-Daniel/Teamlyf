import { IconFile, IconFolder, IconSearch } from "@tabler/icons-react";

export function DocumentsPage() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="border-b bg-card p-5">
        <h1 className="text-xl font-semibold">Documents</h1>
        <p className="text-xs text-muted-foreground">Files, folders and shared resources.</p>
        <div className="relative mt-4 max-w-md">
          <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input disabled placeholder="Search files" className="h-9 w-full rounded-lg border bg-muted pl-9 pr-3 text-sm" />
        </div>
      </header>
      <main className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-5"><IconFolder className="size-7 text-primary" /><p className="mt-4 text-sm font-medium">Shared files</p><p className="mt-1 text-xs text-muted-foreground">Document storage is not connected yet.</p></div>
        <div className="rounded-xl border bg-card p-5"><IconFile className="size-7 text-muted-foreground" /><p className="mt-4 text-sm font-medium">Recent files</p><p className="mt-1 text-xs text-muted-foreground">Recent file activity will appear here when storage is connected.</p></div>
      </main>
    </div>
  );
}
