import { Link } from "@tanstack/react-router";
import { IconCheck } from "@tabler/icons-react";

const plans = [
  { name: "Starter", seats: "5 seats", perks: ["1 AI agent", "30-minute calls", "Core workspace modules"] },
  { name: "Growth", seats: "50 seats", perks: ["5 AI agents", "60-minute calls", "Core workspace modules"], featured: true },
  { name: "Scale", seats: "250 seats", perks: ["20 AI agents", "180-minute calls", "Core workspace modules"] },
] as const;

export function Pricing() {
  return (
    <section id="pricing" className="landing-section scroll-mt-24 px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="landing-kicker">Simple pricing</p>
          <h2 className="landing-section-title mt-3">One product. Pick the size that fits.</h2>
          <p className="landing-section-copy mt-4">Every plan keeps the workspace together. Pricing is available on request while plans are being finalized.</p>
        </div>

        <div className="mt-12 grid gap-3 lg:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.name} className={`landing-price-card ${plan.featured ? "landing-price-featured" : ""}`}>
              {plan.featured && <span className="landing-price-badge">Growth</span>}
              <p className="text-sm font-semibold text-[var(--landing-muted)]">{plan.name}</p>
              <p className="mt-4 text-2xl font-semibold tracking-tight text-[var(--landing-ink)]">Price on request</p>
              <p className="mt-1 text-sm font-medium text-[var(--landing-ink)]">{plan.seats}</p>
              <ul className="mt-7 space-y-3">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2.5 text-sm text-[var(--landing-muted)]">
                    <IconCheck className="mt-0.5 size-4 shrink-0 text-[var(--landing-green)]" aria-hidden="true" />
                    {perk}
                  </li>
                ))}
              </ul>
              <Link to="/sign-up" className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5 ${plan.featured ? "landing-dark-button" : "border border-[var(--landing-line)] bg-[var(--landing-surface)] text-[var(--landing-ink)]"}`}>
                Get started
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
