import { useState, type FormEvent } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { IconArrowRight, IconBuilding, IconPlus } from "@tabler/icons-react";
import { ApiError, api, useApiResource } from "@/lib/api";
import { ResourceState } from "@/components/resource-state";

type Workspace = { id: string; name: string; slug: string; plan: string; role: string; logo?: string | null };

export const Route = createFileRoute("/workspace")({ component: WorkspacePicker });

function WorkspacePicker() {
  const navigate = useNavigate();
  const workspaces = useApiResource<Workspace[]>("/workspaces");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  async function createWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "teamlyf-workspace";
    setCreating(true); setFormError("");
    try {
      const created = await api<{ id: string }>("/organization", { method: "POST", body: JSON.stringify({ name, slug }) });
      await navigate({ to: "/$tenant/pm", params: { tenant: created.id } });
    } catch (reason) {
      setFormError(reason instanceof ApiError ? reason.message : "Unable to create workspace");
    } finally { setCreating(false); }
  }

  return <main className="mx-auto grid min-h-screen w-full max-w-4xl place-items-center p-5"><section className="surface w-full rounded-3xl p-6 sm:p-10"><Link to="/" className="inline-flex items-center gap-2 font-semibold"><span className="grid size-8 place-items-center rounded-lg bg-violet-600 text-white"><IconBuilding className="size-4" /></span>Teamlyf</Link><div className="mt-10 max-w-xl"><p className="eyebrow">Your workspaces</p><h1 className="mt-3 text-4xl">Choose where you want to work.</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Everything stays scoped to the workspace you select.</p></div><div className="mt-8"><ResourceState loading={workspaces.loading} error={workspaces.error} onRetry={workspaces.reload} isEmpty={workspaces.data?.length === 0} emptyTitle="Create your first workspace" emptyCopy="Set up a name below to start inviting teammates and organizing the work." >{workspaces.data && <div className="grid gap-3 sm:grid-cols-2">{workspaces.data.map((workspace) => <button key={workspace.id} onClick={() => void navigate({ to: "/$tenant/pm", params: { tenant: workspace.id } })} className="group rounded-2xl border bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"><div className="flex items-start justify-between"><span className="grid size-10 place-items-center rounded-xl bg-violet-100 text-violet-700"><IconBuilding className="size-5" /></span><IconArrowRight className="size-5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-violet-700" /></div><h2 className="mt-6 font-semibold">{workspace.name}</h2><p className="mt-1 text-sm capitalize text-muted-foreground">{workspace.role} · {workspace.plan}</p></button>)}</div>}</ResourceState></div><form onSubmit={createWorkspace} className="mt-8 rounded-2xl border border-dashed border-violet-300 bg-violet-50/50 p-4 sm:flex sm:items-end sm:gap-3"><label className="block flex-1 text-sm font-semibold">New workspace name<input required name="name" placeholder="e.g. Northstar studio" className="mt-1.5 h-10 w-full rounded-xl border bg-white px-3 text-sm font-medium outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" /></label><button disabled={creating} className="mt-3 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white disabled:opacity-60 sm:mt-0 sm:w-auto"><IconPlus className="size-4" />{creating ? "Creating…" : "Create"}</button>{formError && <p role="alert" className="mt-2 text-sm text-rose-700 sm:absolute">{formError}</p>}</form></section></main>;
}
