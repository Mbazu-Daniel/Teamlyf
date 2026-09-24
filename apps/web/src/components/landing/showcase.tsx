import { IconCheck } from "@tabler/icons-react";

const columns = [
  { label: "To do", tasks: ["Draft launch email", "Audit onboarding flow"] },
  { label: "Doing", tasks: ["Design branding"] },
  { label: "Done", tasks: ["Set up workspace", "Invite the team"] },
] as const;

function BoardMock() {
  return (
    <div className="rounded-2xl border bg-card p-4" aria-hidden="true">
      <div className="grid grid-cols-3 gap-3">
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
    </div>
  );
}

function ThreadMock() {
  return (
    <div className="rounded-2xl border bg-card p-4" aria-hidden="true">
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

type ShowcaseRow = {
  title: string;
  body: string;
  mock: "board" | "thread";
  reverse?: boolean;
};

const rows: ShowcaseRow[] = [
  {
    title: "See project status without asking for it.",
    body: "Boards, milestones, and assignments update when the team works. Each task shows its column, its owner, and its label. The project view shows progress before the stand-up starts.",
    mock: "board",
  },
  {
    title: "Conversation that stays with the work.",
    body: "Channels and threads sit next to the projects they discuss. Reactions, replies, and files keep context with the work. Nothing moves to a separate chat tool.",
    mock: "thread",
    reverse: true,
  },
];

/** Split diptych rows, alternating direction — showcase section. */
export function Showcase() {
  return (
    <section id="showcase" className="scroll-mt-24 border-t border-border bg-background-900/40 px-4 py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-20">
        {rows.map((row) => (
          <div
            key={row.title}
            className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14"
          >
            <div className={row.reverse ? "lg:order-2" : undefined}>
              <h2 className="text-3xl">{row.title}</h2>
              <p className="mt-4 max-w-[56ch] text-xl text-muted-foreground">{row.body}</p>
            </div>
            <div className={row.reverse ? "lg:order-1" : undefined}>
              {row.mock === "board" ? <BoardMock /> : <ThreadMock />}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
