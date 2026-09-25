import type { Icon as TablerIcon } from "@tabler/icons-react";
import { IconFileText, IconLayoutKanban, IconMessage, IconNotes, IconPhone, IconRobot, IconUsers } from "@tabler/icons-react";

const features: Array<{ title: string; body: string; icon: TablerIcon; tone: string }> = [
  { title: "Projects", body: "Tasks, statuses, milestones, labels, comments, and ownership in one view.", icon: IconLayoutKanban, tone: "landing-icon-violet" },
  { title: "Chat", body: "Channels, threads, reactions, and files stay close to the work they discuss.", icon: IconMessage, tone: "landing-icon-blue" },
  { title: "Documents", body: "Shared documents and versions with organization-level access controls.", icon: IconFileText, tone: "landing-icon-orange" },
  { title: "Notes", body: "Keep lightweight knowledge beside projects instead of in another tool.", icon: IconNotes, tone: "landing-icon-yellow" },
  { title: "People & HR", body: "People, departments, leave, and employee workflows connected to the organization.", icon: IconUsers, tone: "landing-icon-green" },
  { title: "Calls", body: "Meet the team without leaving the workspace or losing the project context.", icon: IconPhone, tone: "landing-icon-cyan" },
  { title: "AI agents", body: "Organization-level agents with usage tracking and plan-aware limits.", icon: IconRobot, tone: "landing-icon-pink" },
];

export function Features() {
  return (
    <section id="features" className="landing-section scroll-mt-24 px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="landing-kicker">Everything connected</p>
          <h2 className="landing-section-title mt-3">The work is spread out. Your tools don’t have to be.</h2>
          <p className="landing-section-copy mt-4">Teamlyf brings the daily pieces of a company into one organization so people can move from a task to a conversation, a document, a call, or an AI agent without changing context.</p>
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ title, body, icon: Icon, tone }, index) => (
            <article key={title} className={`landing-feature-card ${index === 0 ? "lg:col-span-2" : ""}`}>
              <span className={`landing-feature-icon ${tone}`}><Icon className="size-5" aria-hidden="true" /></span>
              <h3 className="mt-8 text-lg font-semibold tracking-tight text-[var(--landing-ink)]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--landing-muted)]">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
