import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { IconCheck } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { ActionPill } from "./action-pill";
import { SectionHeading } from "./section-heading";

const columns = [
  { label: "To do", tasks: ["Draft launch email", "Audit onboarding flow"] },
  { label: "Doing", tasks: ["Design branding"] },
  { label: "Done", tasks: ["Set up workspace", "Invite the team"] },
] as const;

function BoardMock() {
  return (
    <div className="grid grid-cols-3 gap-3" aria-hidden="true">
      {columns.map((column) => (
        <div key={column.label}>
          <p className="text-sm font-bold text-muted-foreground">{column.label}</p>
          <div className="mt-2 flex flex-col gap-2">
            {column.tasks.map((task) => (
              <div key={task} className="rounded-lg bg-background-800 px-2.5 py-2 text-sm">
                {task}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ThreadMock() {
  return (
    <div aria-hidden="true">
      <p className="text-sm font-bold text-muted-foreground"># launch</p>
      <div className="mt-3 flex flex-col gap-3">
        <div className="flex gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary-500/20 text-xs font-bold text-secondary-300">
            AO
          </span>
          <div className="min-w-0 rounded-xl rounded-tl-sm bg-background-800 px-3 py-2 text-sm">
            <p className="font-bold">Amara Okafor</p>
            <p className="text-text-200">Branding files are in Documents → Q3.</p>
          </div>
        </div>
        <div className="flex gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-500/20 text-xs font-bold text-primary-300">
            TK
          </span>
          <div className="min-w-0 rounded-xl rounded-tl-sm bg-background-800 px-3 py-2 text-sm">
            <p className="font-bold">Tomas Kruger</p>
            <p className="text-text-200">Picked up the launch checklist. Moving it to Done.</p>
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
              <IconCheck className="size-3 text-accent-400" /> 2
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The mock floats inside a tinted stage, tilted a degree off true, so each row
 * reads as a product shot rather than another card in the stack.
 */
function MockStage({ children, tilt }: { children: ReactNode; tilt: 1 | -1 }) {
  return (
    <div className="rounded-3xl border border-border bg-background-900/50 p-4 sm:p-6">
      <div
        className={cn(
          "rounded-2xl border bg-card p-4 shadow-xl shadow-background-950/50",
          tilt === 1 ? "lg:-rotate-1" : "lg:rotate-1",
        )}
      >
        {children}
      </div>
    </div>
  );
}

type ShowcaseRow = {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  mock: "board" | "thread";
  reverse?: boolean;
};

const rows: ShowcaseRow[] = [
  {
    eyebrow: "Your projects",
    title: "See project status without asking for it.",
    body: "Boards, milestones, and assignments update when the team works. Each task shows its column, its owner, and its label. The project view shows progress before the stand-up starts.",
    cta: "Open projects",
    mock: "board",
  },
  {
    eyebrow: "Your conversations",
    title: "Conversation that stays with the work.",
    body: "Channels and threads sit next to the projects they discuss. Reactions, replies, and files keep context with the work. Nothing moves to a separate chat tool.",
    cta: "Get started",
    mock: "thread",
    reverse: true,
  },
];

/**
 * One diptych row. Kept out of the map body so the copy, the ordering classes
 * and the mock choice are three readable steps rather than one nested callback.
 */
function ShowcaseRow({ row }: { row: ShowcaseRow }) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div className={row.reverse ? "lg:order-2" : undefined}>
        <SectionHeading align="start" eyebrow={row.eyebrow} title={row.title} body={row.body} />
        <ActionPill render={<Link to="/sign-up" />} size="default" className="mt-7">
          {row.cta}
        </ActionPill>
      </div>
      <div className={row.reverse ? "lg:order-1" : undefined}>
        <RowMock mock={row.mock} reverse={Boolean(row.reverse)} />
      </div>
    </div>
  );
}

function RowMock({ mock, reverse }: { mock: ShowcaseRow["mock"]; reverse: boolean }) {
  return (
    <MockStage tilt={reverse ? -1 : 1}>{mock === "board" ? <BoardMock /> : <ThreadMock />}</MockStage>
  );
}

/** Split diptych rows, alternating direction — showcase section. */
export function Showcase() {
  return (
    <section
      id="showcase"
      className="scroll-mt-24 border-y border-border bg-background-900/40 px-4 py-20 sm:py-28"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-20 sm:gap-28">
        {rows.map((row) => (
          <ShowcaseRow key={row.title} row={row} />
        ))}
      </div>
    </section>
  );
}
