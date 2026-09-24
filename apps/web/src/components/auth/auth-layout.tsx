import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { IconCheck, IconRocket } from "@tabler/icons-react";

/**
 * Briefcase asset hosted on the Teamlyf CDN.
 * It is 8.6 MB (a raster image inside an SVG shell) — referenced as-is by request.
 */
const BRIEFCASE = "https://cdn.getteamlyf.com/teamlyf/briefcase.svg";

const points = [
  "Projects, chat, and documents in one place",
  "AI agents stay under your control",
  "Every plan includes the whole workspace",
] as const;

type AuthLayoutProps = Readonly<{
  children: ReactNode;
  title: string;
  description: string;
}>;

/** Split auth shell: form on the left, briefcase panel on the right (stacks below the form on small screens). */
export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_1.05fr]">
      <section className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 font-bold tracking-tight">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <IconRocket className="size-4" />
            </span>
            Teamlyf
          </Link>

          <h1 className="mt-10 text-3xl sm:text-4xl">{title}</h1>
          <p className="mt-3 text-muted-foreground">{description}</p>

          <div className="mt-8">{children}</div>
        </div>
      </section>

      <aside className="relative flex flex-col justify-center gap-6 border-t border-border bg-background-900 p-8 sm:p-12 lg:border-t-0 lg:border-l">
        <img
          src={BRIEFCASE}
          width={528}
          height={428}
          alt="A briefcase that holds a team's projects, chat and documents"
          className="mx-auto w-full max-w-md"
          decoding="async"
        />
        <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-card p-5">
          <p className="text-xl font-bold">One place for the whole team</p>
          <ul className="mt-4 flex flex-col gap-3 text-muted-foreground">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-2">
                <IconCheck className="mt-0.5 size-4 shrink-0 text-accent-400" aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </main>
  );
}
