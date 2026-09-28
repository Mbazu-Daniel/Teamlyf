import type { ReactNode } from "react";
import { IconArrowUpRight, IconCircleCheck } from "@tabler/icons-react";
import { Brand } from "@/components/ui/brand";

const BRIEFCASE = "https://cdn.getteamlyf.com/teamlyf/briefcase.svg";

type AuthLayoutProps = Readonly<{
  children: ReactNode;
  title: string;
  description: string;
}>;

/**
 * Shared auth shell inspired by the existing Teamlyf client: a quiet product
 * story sits alongside a crisp, focused form. Keeping it shared prevents the
 * sign-in, sign-up and password-recovery journeys from drifting apart.
 */
export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <main className="auth-shell grid min-h-svh grid-cols-1 lg:grid-cols-2">
      <aside className="auth-showcase relative hidden min-h-svh overflow-hidden lg:flex">
        <span className="auth-showcase-grid" aria-hidden="true" />
        <span className="auth-showcase-glow auth-showcase-glow-one" aria-hidden="true" />
        <span className="auth-showcase-glow auth-showcase-glow-two" aria-hidden="true" />

        <div className="relative z-10 flex w-full flex-col px-10 py-10 xl:px-14 xl:py-12">
          <Brand />

          <div className="mt-14 max-w-md xl:mt-18">
            <p className="auth-showcase-kicker">ONE WORKSPACE</p>
            <h2 className="auth-showcase-title mt-4">
              The calm place for your team&apos;s most important work.
            </h2>
            <p className="auth-showcase-copy mt-4">
              Projects, conversations, knowledge, and AI stay connected from the first idea to the
              finished work.
            </p>
          </div>

          <div
            className="auth-showcase-visual mx-auto mt-auto w-full max-w-md"
            aria-label="Teamlyf brings team work together"
          >
            <span className="auth-showcase-ring auth-showcase-ring-outer" aria-hidden="true" />
            <span className="auth-showcase-ring auth-showcase-ring-inner" aria-hidden="true" />
            <img
              src={BRIEFCASE}
              width={528}
              height={428}
              alt="A briefcase that holds a team's projects, chat and documents"
              className="auth-showcase-illustration"
              decoding="async"
            />
            <span className="auth-showcase-badge auth-showcase-badge-top">
              <IconCircleCheck className="size-4" aria-hidden="true" />
              Work in sync
            </span>
            <span className="auth-showcase-badge auth-showcase-badge-bottom">
              Private by design
              <IconArrowUpRight className="size-4" aria-hidden="true" />
            </span>
          </div>

          <p className="mt-7 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
            Built for focused teams.
          </p>
        </div>
      </aside>

      <section className="auth-form-pane flex min-h-svh items-center justify-center px-5 py-10 sm:px-8 lg:px-12 xl:px-16">
        <div className="w-full max-w-md">
          <Brand className="lg:hidden" />

          <header className="auth-form-heading">
            <p className="auth-form-kicker">TEAMLYF ACCOUNT</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-[2.5rem] sm:leading-[1.08]">
              {title}
            </h1>
            <p className="mt-3 max-w-sm text-[15px] leading-6 text-muted-foreground">
              {description}
            </p>
          </header>

          <div className="auth-form-content mt-8">{children}</div>
        </div>
      </section>
    </main>
  );
}
