import { createFileRoute } from "@tanstack/react-router";
import { IconBuilding, IconRocket, IconUsers } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useOrganization } from "@/lib/organization";

export const Route = createFileRoute("/")({ component: Home });
function Home() {
  const { organization, selectOrganization } = useOrganization();
  const current = organization ?? { id: "current", name: "Your organization" };
  return <main className="min-h-screen bg-background text-foreground">
    <header className="border-b bg-card"><div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4"><div className="flex items-center gap-2 font-semibold"><IconRocket className="size-5" />Teamlyf</div><div className="flex items-center gap-2 text-sm text-muted-foreground"><IconBuilding className="size-4" />{current.name}</div></div></header>
    <section className="mx-auto max-w-6xl px-6 py-12"><p className="mb-2 text-sm font-medium text-muted-foreground">Organization workspace</p><h1 className="max-w-2xl text-4xl font-semibold tracking-tight">Everything your team needs, in one place.</h1><p className="mt-4 max-w-2xl text-muted-foreground">Projects, conversations, documents, notes, HR, calls and agents are organized around your organization.</p>
    <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["Projects","Tasks, milestones and delivery"],["Chat","Channels, messages and threads"],["Documents","Shared organization knowledge"],["Agents","AI agents and usage"]].map(([title,description])=><article key={title} className="rounded-xl border bg-card p-5"><h2 className="font-medium">{title}</h2><p className="mt-2 text-sm text-muted-foreground">{description}</p></article>)}</div>
    <div className="mt-8 rounded-xl border bg-card p-6"><div className="flex items-center gap-3"><IconUsers className="size-5"/><div><h2 className="font-medium">Organization-first access</h2><p className="text-sm text-muted-foreground">Every module is selected within the current organization context.</p></div></div><Button className="mt-5" onClick={()=>selectOrganization(current)}>Continue</Button></div>
    </section></main>;
}
