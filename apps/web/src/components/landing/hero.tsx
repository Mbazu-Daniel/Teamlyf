import { Link } from "@tanstack/react-router";
import { IconArrowDownRight, IconSparkles } from "@tabler/icons-react";
import { HeroCards } from "./hero-cards";

export function Hero() {
  return (
    <section className="landing-hero relative px-4 pb-16 pt-32 sm:px-6 sm:pb-24 sm:pt-40">
      <div className="landing-orb landing-orb-one" aria-hidden="true" />
      <div className="landing-orb landing-orb-two" aria-hidden="true" />

      <div className="relative mx-auto max-w-5xl text-center">
        <div className="landing-reveal inline-flex items-center gap-2 rounded-full border border-[var(--landing-line)] bg-white/70 px-3.5 py-1.5 text-sm font-medium text-[var(--landing-muted)] shadow-sm backdrop-blur-sm">
          <IconSparkles className="size-3.5" aria-hidden="true" />
          One place for the way your team works
        </div>

        <h1 className="landing-reveal landing-reveal-delay-1 mx-auto mt-7 max-w-4xl text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.045em] text-[var(--landing-ink)] sm:text-6xl lg:text-7xl">
          Everything your team needs. <span className="landing-accent">Finally together.</span>
        </h1>

        <p className="landing-reveal landing-reveal-delay-2 mx-auto mt-6 max-w-2xl text-pretty text-lg leading-7 text-[var(--landing-muted)] sm:text-xl">
          Projects, chat, documents, notes, HR, calls, and AI agents in one organization. Teamlyf keeps the work, the people, and the context connected.
        </p>

        <div className="landing-reveal landing-reveal-delay-3 mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/sign-up" className="landing-dark-button inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold">
            Start building
            <span className="grid size-6 place-items-center rounded-full bg-white/15">
              <IconArrowDownRight className="size-3.5" aria-hidden="true" />
            </span>
          </Link>
          <a href="#product" className="inline-flex items-center rounded-full border border-[var(--landing-line)] bg-white/65 px-6 py-3 text-sm font-semibold text-[var(--landing-ink)] transition-all hover:-translate-y-0.5 hover:bg-white">
            See the workspace
          </a>
        </div>
      </div>

      <div className="landing-reveal landing-reveal-delay-4 relative mx-auto mt-16 max-w-6xl sm:mt-20">
        <HeroCards />
      </div>
    </section>
  );
}
