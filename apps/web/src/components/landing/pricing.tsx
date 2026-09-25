import { Link } from "@tanstack/react-router";
import { IconCheck } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ActionPill } from "./action-pill";
import { SectionHeading } from "./section-heading";

/**
 * Real entitlements from apps/api/src/modules/billing/plan-entitlements.ts.
 * Price stays "Price on request" until real numbers exist. Never invent metrics (slop gate 46).
 */
const plans = [
  {
    name: "Starter",
    seats: "5 seats",
    perks: ["1 AI agent", "30-minute calls", "All six modules"],
    recommended: false,
  },
  {
    name: "Growth",
    seats: "50 seats",
    perks: ["5 AI agents", "60-minute calls", "All six modules"],
    recommended: true,
  },
  {
    name: "Scale",
    seats: "250 seats",
    perks: ["20 AI agents", "180-minute calls", "All six modules"],
    recommended: false,
  },
] as const;

/** Pricing-card lift is motion primitive 3 of 3 — via the shared `.crisp-card`. */
export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-24 px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Our pricing"
          title="Simple, transparent pricing."
          body="Choose by team size. Every plan includes the whole workspace."
        />

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={cn(
                "crisp-card flex flex-col rounded-2xl border bg-card p-6",
                plan.recommended && "border-primary-500/60",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xl">{plan.name}</h3>
                {plan.recommended && <Badge variant="primary">Recommended</Badge>}
              </div>

              <p className="mt-4 text-xl font-bold text-text-200">Price on request</p>
              <p className="mt-1 font-bold">{plan.seats}</p>

              <ul className="mt-5 flex flex-col gap-2.5 text-muted-foreground">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2">
                    <IconCheck
                      className="mt-0.5 size-4 shrink-0 text-accent-400"
                      aria-hidden="true"
                    />
                    {perk}
                  </li>
                ))}
              </ul>

              {plan.recommended ? (
                <ActionPill
                  render={<Link to="/sign-up" />}
                  className="mt-7 w-full justify-between pl-6"
                >
                  Choose {plan.name}
                </ActionPill>
              ) : (
                <Button render={<Link to="/sign-up" />} variant="outline" className="mt-7 w-full">
                  Choose {plan.name}
                </Button>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
