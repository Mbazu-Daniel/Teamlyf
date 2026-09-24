import { Button } from "@/components/ui/button";
import { HeroCards } from "./hero-cards";
import { Link } from "@tanstack/react-router";

export function Hero() {
  return (
    <section className="px-4 pt-28 pb-40">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        {/* left-bias copy column — modern-minimal two-column hero */}
        <div className="flex flex-col items-start">
          <span
            className="reveal reveal-y rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground"
            style={{ animationDelay: "0ms" }}
          >
            One login for every module
          </span>
          <h1
            className="reveal reveal-y mt-5 text-4xl leading-[1.05] sm:text-5xl"
            style={{ animationDelay: "60ms" }}
          >
            Projects, chat, docs, and AI agents in one place.
          </h1>
          <p
            className="reveal reveal-y mt-5 max-w-[52ch] text-xl leading-relaxed text-muted-foreground"
            style={{ animationDelay: "120ms" }}
          >
            Teamlyf is one project management workspace. It holds tasks, chat, notes, HR, calls,
            and AI agents. Your team stops switching tools.
          </p>
          <div
            className="reveal reveal-y mt-8 flex flex-wrap items-center gap-3"
            style={{ animationDelay: "180ms" }}
          >
            <Button render={<Link to="/projects" />} size="lg">
              Get started
            </Button>
            <Button render={<a href="#showcase" />} variant="outline" size="lg">
              See how it works
            </Button>
          </div>
        </div>

        <HeroCards />
      </div>
    </section>
  );
}
