import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

/** One sentence, one button — the repetition is the call to action. */
export function Cta() {
  return (
    <section className="border-t border-border bg-background-900/40 px-4 py-20">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[24ch] text-3xl leading-tight font-bold sm:text-4xl">
          Bring your team into one workspace.
        </p>
        <Button render={<Link to="/projects" />} size="lg">
          Get started
        </Button>
      </div>
    </section>
  );
}
