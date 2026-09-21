import { useState, type ReactNode } from "react";
import { Link, useParams } from "@tanstack/react-router";
import {
  IconBell,
  IconBriefcase,
  IconBuilding,
  IconFileText,
  IconMenu2,
  IconMessageCircle,
  IconNotes,
  IconPhone,
  IconRobot,
  IconSearch,
  IconSettings,
  IconShieldCheck,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import { api, organizationPath, useApiResource } from "@/lib/api";

const items = [
  { to: "/$tenant/pm", label: "Projects", icon: IconBriefcase },
  { to: "/$tenant/chat", label: "Chat", icon: IconMessageCircle },
  { to: "/$tenant/docs", label: "Documents", icon: IconFileText },
  { to: "/$tenant/notes", label: "Notes", icon: IconNotes },
  { to: "/$tenant/hr", label: "People", icon: IconUsers },
  { to: "/$tenant/agents", label: "Agents", icon: IconRobot },
  { to: "/$tenant/calls", label: "Calls", icon: IconPhone },
  { to: "/$tenant/settings/access", label: "Access & roles", icon: IconShieldCheck },
  { to: "/$tenant/settings/billing", label: "Settings & billing", icon: IconSettings },
];
type Workspace = { id: string; name: string; role: string };
type Result = { label: string; kind: string };
export function WorkspaceShell({ children }: { children: ReactNode }) {
  const { tenant } = useParams({ strict: false }) as { tenant: string };
  const workspaces = useApiResource<Workspace[]>("/workspaces");
  const workspace = workspaces.data?.find((item) => item.id === tenant);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [searching, setSearching] = useState(false);
  const agentTasks = useApiResource<Array<{ id: string; status: string; createdAt: string }>>(organizationPath(tenant, "/agents/tasks"));
  const nav = () => (
    <nav className="space-y-1">
      {items.map(({ to, label, icon: Icon }) => (
        <Link
          key={label}
          onClick={() => setMenuOpen(false)}
          to={to}
          params={{ tenant }}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-violet-50 hover:text-violet-700"
          activeProps={{
            className:
              "bg-violet-600 text-white shadow-[0_2px_6px_rgba(91,80,217,0.22)] hover:bg-violet-600 hover:text-white",
          }}
        >
          <Icon className="size-[1.05rem]" />
          {label}
        </Link>
      ))}
    </nav>
  );
  async function search(value: string) {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const [projects, documents, notes, channels] = await Promise.all([
        api<Array<{ name: string }>>(organizationPath(tenant, "/projects")),
        api<Array<{ title: string }>>(organizationPath(tenant, "/documents")),
        api<Array<{ title: string }>>(organizationPath(tenant, "/notes")),
        api<Array<{ name: string }>>(organizationPath(tenant, "/channels")),
      ]);
      const needle = value.toLowerCase();
      setResults([
        ...projects
          .filter((item) => item.name.toLowerCase().includes(needle))
          .map((item) => ({ label: item.name, kind: "Project" })),
        ...documents
          .filter((item) => item.title.toLowerCase().includes(needle))
          .map((item) => ({ label: item.title, kind: "Document" })),
        ...notes
          .filter((item) => item.title.toLowerCase().includes(needle))
          .map((item) => ({ label: item.title, kind: "Note" })),
        ...channels
          .filter((item) => item.name.toLowerCase().includes(needle))
          .map((item) => ({ label: item.name, kind: "Channel" })),
      ]);
    } finally {
      setSearching(false);
    }
  }
  return (
    <div className="min-h-screen text-foreground lg:grid lg:grid-cols-[15.75rem_1fr]">
      <aside className="hidden min-h-screen flex-col border-r border-violet-100 bg-gradient-to-b from-violet-50/80 via-white to-violet-50/35 p-3 shadow-[2px_0_10px_rgba(91,80,217,0.04)] lg:flex">
        <Link
          to="/$tenant/pm"
          params={{ tenant }}
          className="mb-8 flex items-center gap-2.5 px-2 text-[0.9375rem] font-semibold tracking-[-0.025em]"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-500 text-white">
            <IconBuilding className="size-[1.05rem]" />
          </span>
          Teamlyf
        </Link>
        <p className="eyebrow mb-2 px-3">Workspace</p>
        {nav()}
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-10 flex h-16 items-center border-b border-border bg-[#F7F9FC]/95 px-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-2.5">
            <button
              aria-label="Open navigation"
              onClick={() => setMenuOpen(true)}
              className="grid size-8 place-items-center rounded-md hover:bg-white lg:hidden"
            >
              <IconMenu2 className="size-5" />
            </button>
            <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-500 text-white lg:hidden">
              <IconBuilding className="size-4" />
            </span>
          </div>
          <button
            onClick={() => setSearchOpen(true)}
            className="ml-5 hidden items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-[0.75rem] text-muted-foreground shadow-[0_2px_5px_rgba(18,38,63,0.02)] sm:flex"
          >
            <IconSearch className="size-4" />
            Search workspace{" "}
            <kbd className="ml-8 rounded border border-border bg-muted px-1.5 text-[0.625rem]">
              ⌘ K
            </kbd>
          </button>
          <div className="relative ml-auto flex items-center gap-2">
            <button
              onClick={() => setNotificationsOpen((value) => !value)}
              aria-label="Notifications"
              className="grid size-9 place-items-center rounded-md text-muted-foreground transition hover:bg-white hover:text-violet-700"
            >
              <IconBell className="size-[1.1rem]" />
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 top-11 w-72 rounded-xl border border-border bg-white p-4 shadow-[0_12px_32px_rgba(18,38,63,0.12)]">
                <p className="text-[0.8125rem] font-semibold">Notifications</p>
                <div className="mt-2 space-y-2">{(agentTasks.data ?? []).slice(0, 3).map((task) => <div key={task.id} className="rounded-lg bg-muted p-2 text-[0.75rem]"><strong>Agent action {task.status.replaceAll("_", " ")}</strong><p className="mt-0.5 text-muted-foreground">{new Date(task.createdAt).toLocaleString()}</p></div>)}{!agentTasks.data?.length && <p className="text-[0.75rem] leading-5 text-muted-foreground">You’re all caught up. New chat messages and approval requests appear here as they arrive.</p>}</div>
              </div>
            )}
            <button onClick={() => setAccountOpen((value) => !value)} className="ml-1 hidden min-w-0 items-center gap-2.5 rounded-lg border border-violet-100 bg-violet-50/70 px-2.5 py-1.5 text-left sm:flex">
              <span className="grid size-7 shrink-0 place-items-center rounded-md bg-gradient-to-br from-violet-600 to-indigo-500 text-white">
                <IconBuilding className="size-3.5" />
              </span>
              <div className="min-w-0 pr-1">
                <p className="truncate text-[0.75rem] font-semibold">
                  {workspace?.name ?? "Loading workspace…"}
                </p>
                <p className="truncate text-[0.625rem] text-muted-foreground">
                  {workspace?.role ?? "Member"} workspace
                </p>
              </div>
            </button>
            {accountOpen && <div className="absolute right-0 top-12 w-72 rounded-xl border border-border bg-white p-3 shadow-[0_12px_32px_rgba(18,38,63,0.12)]"><p className="eyebrow px-2">Workspaces</p><div className="mt-2 space-y-1">{workspaces.data?.map((item) => <Link key={item.id} to="/$tenant/pm" params={{ tenant: item.id }} onClick={() => setAccountOpen(false)} className={`block rounded-lg px-3 py-2 text-sm ${item.id === tenant ? "bg-violet-50 font-semibold text-violet-700" : "hover:bg-muted"}`}><span className="block">{item.name}</span><span className="text-[0.625rem] font-normal text-muted-foreground">{item.role} workspace</span></Link>)}</div><Link to="/workspace" onClick={() => setAccountOpen(false)} className="mt-2 block rounded-lg border px-3 py-2 text-xs font-semibold text-violet-700">Manage workspaces</Link><Link to="/$tenant/settings/access" params={{ tenant }} onClick={() => setAccountOpen(false)} className="mt-2 block px-3 py-2 text-xs font-semibold text-muted-foreground">Account & access</Link></div>}
          </div>
        </header>
        <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-[92rem] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/35 p-3 lg:hidden">
          <aside className="flex h-full w-[15.75rem] flex-col rounded-xl border border-violet-100 bg-gradient-to-b from-violet-50 to-white p-3 shadow-2xl">
            <div className="mb-7 flex items-center justify-between">
              <Link
                onClick={() => setMenuOpen(false)}
                to="/$tenant/pm"
                params={{ tenant }}
                className="text-[0.9375rem] font-semibold"
              >
                Teamlyf
              </Link>
              <button
                aria-label="Close navigation"
                onClick={() => setMenuOpen(false)}
              >
                <IconX className="size-5" />
              </button>
            </div>
            {nav()}
          </aside>
        </div>
      )}
      {searchOpen && (
        <div className="fixed inset-0 z-50 grid place-items-start bg-slate-950/35 p-5 pt-24">
          <section className="w-full max-w-xl rounded-xl border border-border bg-white p-4 shadow-[0_16px_40px_rgba(18,38,63,0.16)]">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <IconSearch className="size-5 text-[#14506D]" />
              <input
                autoFocus
                value={query}
                onChange={(event) => void search(event.target.value)}
                placeholder="Search projects, documents, notes, and channels"
                className="min-w-0 flex-1 border-0 bg-transparent text-[0.8125rem] outline-none"
              />
              <button onClick={() => setSearchOpen(false)}>
                <IconX className="size-4" />
              </button>
            </div>
            <div className="mt-3 max-h-80 overflow-auto">
              {searching ? (
                <p className="p-3 text-sm text-muted-foreground">Searching…</p>
              ) : results.length ? (
                results.map((result, index) => (
                  <div
                    key={`${result.kind}-${result.label}-${index}`}
                    className="flex justify-between rounded-md p-3 text-sm hover:bg-muted"
                  >
                    <span>{result.label}</span>
                    <span className="text-muted-foreground">{result.kind}</span>
                  </div>
                ))
              ) : query ? (
                <p className="p-3 text-sm text-muted-foreground">
                  No matching workspace items.
                </p>
              ) : (
                <p className="p-3 text-sm text-muted-foreground">
                  Start typing to search live workspace data.
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
