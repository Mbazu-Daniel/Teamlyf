import { Link } from "@tanstack/react-router";

export function Cta() {
  return (
    <section className="px-4 pb-20 sm:px-6 sm:pb-28">
      <div className="landing-cta mx-auto max-w-6xl px-6 py-14 text-center sm:px-10 sm:py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--landing-ink)]/55">Ready when you are</p>
        <h2 className="mx-auto mt-4 max-w-2xl text-balance text-4xl font-semibold leading-tight tracking-[-0.035em] text-[var(--landing-ink)] sm:text-5xl">Bring the work together.</h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[var(--landing-ink)]/65">Start with projects. Add the rest as your team needs it.</p>
        <Link to="/sign-up" className="mt-8 inline-flex items-center rounded-full bg-[var(--landing-surface)] px-6 py-3 text-sm font-semibold text-[var(--landing-ink)] transition-transform hover:-translate-y-0.5">Create your organization</Link>
      </div>
    </section>
  );
}
