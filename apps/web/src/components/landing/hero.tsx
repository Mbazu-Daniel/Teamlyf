import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ActionPill } from "./action-pill";
import { HeroCards } from "./hero-cards";

/**
 * Centred hero over a floating product collage, lit by the brand aurora.
 * The copy column carries the reveal; the collage columns carry the offsets,
 * so the two never fight over `transform`.
 */
export function Hero() {
  return (
    <section className="relative px-4 pt-32 pb-20 sm:pt-40 sm:pb-28">
      <div className="aurora" aria-hidden="true" />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
        <span
          className="reveal reveal-y rounded-full border border-border bg-card/80 px-3.5 py-1.5 text-sm text-muted-foreground backdrop-blur-sm"
          style={{ animationDelay: "0ms" }}
        >
          One login for every module
        </span>

        <h1
          className="reveal reveal-y mt-7 text-4xl leading-[1.02] tracking-[-0.03em] text-balance sm:text-5xl lg:text-6xl"
          style={{ animationDelay: "60ms" }}
        >
          Projects, chat, docs, and AI agents in one place.
        </h1>

        <p
          className="reveal reveal-y mt-6 max-w-[52ch] text-xl leading-relaxed text-balance text-muted-foreground"
          style={{ animationDelay: "120ms" }}
        >
          Teamlyf is one project management workspace. It holds tasks, chat, notes, HR, calls, and
          AI agents. Your team stops switching tools.
        </p>

        <div
          className="reveal reveal-y mt-9 flex flex-wrap items-center justify-center gap-3"
          style={{ animationDelay: "180ms" }}
        >
          <ActionPill render={<Link to="/sign-up" />}>Get started</ActionPill>
          <Button render={<a href="#features" />} variant="outline" size="lg">
            See how it works
          </Button>
        </div>
      </div>

      <div className="relative mx-auto mt-20 max-w-5xl sm:mt-24">
        <HeroCards />
      </div>
    </section>
  );
}
