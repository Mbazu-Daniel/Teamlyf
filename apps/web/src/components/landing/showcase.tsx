import type { ReactNode } from "react";
import { IconCheck, IconFileText, IconMessage, IconRobot, IconUsers } from "@tabler/icons-react";

function ProductWindow({ children }: { children: ReactNode }) {
  return (
    <div className="landing-product-window">
      <div className="flex items-center gap-2 border-b border-[var(--landing-line)] px-4 py-3">
        <span className="size-2 rounded-full bg-[var(--landing-red)]" />
        <span className="size-2 rounded-full bg-[var(--landing-yellow)]" />
        <span className="size-2 rounded-full bg-[var(--landing-green)]" />
        <div className="ml-2 h-5 flex-1 rounded-full bg-[var(--landing-soft)]" />
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}

function ConversationMock() {
  return (
    <ProductWindow>
      <div className="grid gap-5 sm:grid-cols-[150px_1fr]">
        <div className="space-y-1">
          {['# product', '# launch', '# design', '# general'].map((item, index) => (
            <div key={item} className={`rounded-lg px-2.5 py-2 text-xs ${index === 0 ? 'bg-[var(--landing-soft)] font-semibold text-[var(--landing-ink)]' : 'text-[var(--landing-muted)]'}`}>{item}</div>
          ))}
        </div>
        <div>
          <div className="flex items-center gap-2 border-b border-[var(--landing-line)] pb-3"><IconMessage className="size-4" /><span className="text-sm font-semibold"># product</span></div>
          <div className="space-y-4 pt-4">
            <Message initials="AO" title="Amara" text="The onboarding flow is ready for review." />
            <Message initials="TK" title="Tomas" text="I linked the project tasks and the latest document." accent />
            <Message initials="JM" title="Jamal" text="Perfect. I’ll take the call notes and update the next steps." />
          </div>
        </div>
      </div>
    </ProductWindow>
  );
}

function Message({ initials, title, text, accent }: { initials: string; title: string; text: string; accent?: boolean }) {
  return (
    <div className="flex gap-3">
      <span className={`grid size-8 shrink-0 place-items-center rounded-full text-[10px] font-bold ${accent ? 'bg-[var(--landing-lilac)]' : 'bg-[var(--landing-soft)]'}`}>{initials}</span>
      <div><p className="text-xs font-semibold text-[var(--landing-ink)]">{title}</p><p className="mt-1 max-w-sm text-xs leading-5 text-[var(--landing-muted)]">{text}</p></div>
    </div>
  );
}

function OrganizationMock() {
  return (
    <ProductWindow>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="landing-demo-card">
          <div className="flex items-center justify-between"><span className="text-xs font-semibold">People</span><IconUsers className="size-4 text-[var(--landing-muted)]" /></div>
          <div className="mt-5 flex -space-x-2"><span className="landing-avatar">AO</span><span className="landing-avatar">TK</span><span className="landing-avatar">JM</span><span className="landing-avatar">+5</span></div>
          <p className="mt-4 text-[10px] leading-4 text-[var(--landing-muted)]">Members, departments, leave and organization access in one place.</p>
        </div>
        <div className="landing-demo-card">
          <div className="flex items-center justify-between"><span className="text-xs font-semibold">AI agent</span><IconRobot className="size-4 text-[var(--landing-muted)]" /></div>
          <div className="mt-5 rounded-xl bg-[var(--landing-soft)] p-3 text-[10px] leading-4 text-[var(--landing-muted)]">Summarize this week’s project activity and list the unresolved tasks.</div>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold"><IconCheck className="size-3" /> Ready for the team</div>
        </div>
        <div className="landing-demo-card sm:col-span-2">
          <div className="flex items-center justify-between"><span className="text-xs font-semibold">Shared knowledge</span><IconFileText className="size-4 text-[var(--landing-muted)]" /></div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3"><span className="rounded-lg bg-[var(--landing-soft)] p-2 text-[10px]">Launch brief</span><span className="rounded-lg bg-[var(--landing-soft)] p-2 text-[10px]">Product notes</span><span className="rounded-lg bg-[var(--landing-soft)] p-2 text-[10px]">Meeting notes</span></div>
        </div>
      </div>
    </ProductWindow>
  );
}

export function Showcase() {
  return (
    <section id="product" className="landing-soft-section scroll-mt-24 px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl space-y-24 sm:space-y-32">
        <div className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="landing-kicker">Work in context</p>
            <h2 className="landing-section-title mt-3">Projects and conversations belong together.</h2>
            <p className="landing-section-copy mt-4">A task can lead to a thread. A thread can lead to a document. A document can become the input for the next task. Teamlyf keeps those relationships close.</p>
            <a href="#features" className="landing-text-link mt-6">Explore the workspace <span aria-hidden="true">↗</span></a>
          </div>
          <div className="landing-float-slow"><ConversationMock /></div>
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
          <div className="landing-float-slower lg:order-1"><OrganizationMock /></div>
          <div className="lg:order-2">
            <p className="landing-kicker">One organization</p>
            <h2 className="landing-section-title mt-3">People, knowledge, and AI share the same foundation.</h2>
            <p className="landing-section-copy mt-4">Organization-level access, billing, AI usage, and collaboration make Teamlyf feel like one product instead of a bundle of disconnected tools.</p>
            <a href="#pricing" className="landing-text-link mt-6">View plans <span aria-hidden="true">↗</span></a>
          </div>
        </div>
      </div>
    </section>
  );
}
