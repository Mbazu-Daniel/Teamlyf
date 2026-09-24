import type { Icon as TablerIcon } from "@tabler/icons-react";
import {
  IconCalendarTime,
  IconFileText,
  IconLayoutKanban,
  IconMessages,
  IconNotes,
  IconRobot,
  IconUsers,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

type Feature = {
  title: string;
  body: string;
  icon: TablerIcon;
  span?: string;
};

const features: Feature[] = [
  {
    title: "Projects",
    body: "Track tasks, milestones, labels, and statuses from backlog to done.",
    icon: IconLayoutKanban,
    span: "sm:col-span-2",
  },
  {
    title: "Chat",
    body: "Channels, threads, and reactions that stay inside your workspace.",
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
    span: "sm:col-span-2",
  },
  { title: "Calls", body: "Video calls with per-plan durations.", icon: IconCalendarTime },
];

function FeatureCard({ title, body, icon: Icon, span }: Feature) {
  return (
    <article className={cn("rounded-2xl border bg-card p-5", span)}>
      <div className="flex items-center gap-2">
        <Icon className="size-5 shrink-0 text-primary-300" aria-hidden="true" />
        <h3 className="text-xl">{title}</h3>
      </div>
      <p className="mt-2 text-muted-foreground">{body}</p>
    </article>
  );
}

/** Irregular bento — varied spans, icons inline with headings, never icon-above-heading. */
export function Features() {
  return (
    <section id="features" className="scroll-mt-24 px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <h2 className="text-3xl sm:text-4xl">
            One workspace for project management, chat, and AI agents.
          </h2>
          <p className="mt-4 text-xl text-muted-foreground">
            Projects, chat, documents, notes, HR, calls, and agents use one organization. Your team
            moves between them in one click. You pay for one product.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
