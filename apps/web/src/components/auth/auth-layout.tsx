import type { ReactNode } from "react";
import { Brand } from "@/components/ui/brand";

const BRIEFCASE = "https://cdn.getteamlyf.com/teamlyf/briefcase.svg";

type AuthLayoutProps = Readonly<{
  children: ReactNode;
  title: string;
  description?: string;
}>;

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <main className="auth-shell grid min-h-svh grid-cols-1 lg:grid-cols-2">
      <aside className="auth-showcase relative hidden min-h-svh overflow-hidden lg:flex">
        <span className="auth-showcase-grid" aria-hidden="true" />
        <span className="auth-showcase-glow auth-showcase-glow-one" aria-hidden="true" />
        <span className="auth-showcase-glow auth-showcase-glow-two" aria-hidden="true" />

        <div className="relative z-10 flex w-full items-center justify-center p-10 xl:p-14">
          <div className="auth-showcase-visual w-full max-w-md">
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
          </div>
        </div>
      </aside>

      <section className="auth-form-pane flex min-h-svh flex-col px-5 py-6 sm:px-8 lg:px-12 xl:px-16">
        <div className="flex w-full justify-end">
          <Brand />
        </div>

        <div className="flex w-full flex-1 items-center justify-center py-8">
          <div className="auth-form-card w-full max-w-lg rounded-xl border border-border bg-card p-6 sm:p-8">
            <header className="auth-form-heading text-center">
              <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-[30px] sm:leading-tight">
                {title}
              </h1>
              {description && (
                <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
              )}
            </header>

            <div className="auth-form-content mt-8">{children}</div>
          </div>
        </div>
      </section>
    </main>
  );
}
