import type { ReactNode } from "react";
import { Brand } from "@/components/ui/brand";

/**
 * Briefcase asset hosted on the Teamlyf CDN.
 * It is 8.6 MB (a raster image inside an SVG shell) — referenced as-is by request.
 */
const BRIEFCASE = "https://cdn.getteamlyf.com/teamlyf/briefcase.svg";

/** Shown one at a time under the briefcase — a caption, not a list. */
const lines = [
  "Projects, chat, and documents in one place",
  "AI agents stay under your control",
  "Every plan includes the whole workspace",
] as const;

type AuthLayoutProps = Readonly<{
  children: ReactNode;
  title: string;
  description: string;
}>;

/**
 * Split auth shell. Both auth pages read the same way: the form owns the
 * right-hand column and the illustration panel the left; below `lg` the panel
 * stacks under the form. Sign-in and sign-up are one screen apart, so moving
 * between them never shifts the layout.
 */
export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      <section className="flex items-center justify-center px-4 py-12 sm:px-8 lg:order-2">
        <div className="w-full max-w-md">
          <Brand />

          <h1 className="mt-10 text-3xl sm:text-4xl">{title}</h1>
          <p className="mt-3 text-muted-foreground">{description}</p>

          <div className="mt-8">{children}</div>
        </div>
      </section>

      <aside className="relative flex flex-col justify-center gap-6 overflow-hidden border-t border-border bg-background-900 p-8 sm:p-12 lg:order-1 lg:border-t-0 lg:border-r">
        <span className="auth-aura" aria-hidden="true" />

        <img
          src={BRIEFCASE}
          width={528}
          height={428}
          alt="A briefcase that holds a team's projects, chat and documents"
          className="auth-float relative mx-auto w-full max-w-md"
          decoding="async"
        />
        <div className="auth-rotator relative mx-auto w-full max-w-md">
          {lines.map((line) => (
            <p
              key={line}
              className="auth-line flex items-center justify-center gap-2.5 text-center text-sm font-bold text-text-200"
            >
              <span className="size-1.5 shrink-0 rounded-full bg-primary-400" aria-hidden="true" />
              {line}
            </p>
          ))}
        </div>
      </aside>
    </main>
  );
}
