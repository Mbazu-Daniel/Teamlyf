import type { Icon as TablerIcon } from "@tabler/icons-react";
import {
  IconFileText,
  IconLayoutKanban,
  IconMessages,
  IconNotes,
  IconRobot,
  IconUsers,
} from "@tabler/icons-react";
import { SectionHeading } from "./section-heading";

type Feature = {
  title: string;
  body: string;
  icon: TablerIcon;
};

const features: Feature[] = [
  {
    title: "Projects",
    body: "Track tasks, milestones, labels, and statuses from backlog to done.",
    icon: IconLayoutKanban,
  },
  {
    title: "Chat & Calls",
    body: "Channels, threads, reactions, and video calls that stay inside your workspace.",
    icon: IconMessages,
  },
  {
    title: "Documents",
    body: "Shared docs with versions and per-member permissions.",
    icon: IconFileText,
  },
  { title: "Notes", body: "Quick notes attached to the work they belong to.", icon: IconNotes },
  {
    title: "HR",
    body: "Departments, member profiles, and leave in the same place as the work.",
    icon: IconUsers,
  },
  {
    title: "Agents",
    body: "AI agents with tracked usage and per-plan limits. Configure them once for the whole organization.",
    icon: IconRobot,
  },
];

function FeatureCard({ title, body, icon: Icon }: Feature) {
  return (
    <article className="crisp-card rounded-2xl border bg-card p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-primary-500/15 text-primary-300">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <h3 className="text-xl">{title}</h3>
      </div>
      <p className="mt-3 text-muted-foreground">{body}</p>
    </article>
  );
}

/** Uniform three-up grid — every module reads at the same weight, icons inline with headings. */
export function Features() {
  return (
    <section id="features" className="scroll-mt-24 px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Our modules"
          title="One workspace for project management, chat, and AI agents."
          body="Projects, chat and calls, documents, notes, HR, and agents use one organization. Your team moves between them in one click. You pay for one product."
        />
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
