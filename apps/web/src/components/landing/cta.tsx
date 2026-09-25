import { Link } from "@tanstack/react-router";
import { ActionPill } from "./action-pill";

/** One sentence, one button — the repetition is the call to action. */
export function Cta() {
  return (
    <section className="border-t border-border bg-background-900/40 px-4 py-20 sm:py-28">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <h2 className="text-4xl leading-[1.05] tracking-[-0.03em] sm:text-5xl">
          Bring your team into one workspace.
        </h2>
        <p className="mt-5 max-w-[46ch] text-xl text-muted-foreground">
          Seven modules, one login, one plan. Start with the projects you already have.
        </p>
        <ActionPill render={<Link to="/sign-up" />} className="mt-8">
          Get started
        </ActionPill>
      </div>
    </section>
  );
}
