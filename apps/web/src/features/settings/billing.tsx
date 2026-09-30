import { useEffect, useState } from "react";
import { settingsApi, type BillingSummary, type CheckoutResponse } from "@/lib/api";
import {
  SettingsSection,
  pagePrimaryAction,
  pageSecondaryAction,
} from "@/components/workspace/page-layout";
import { IconCheck, IconCreditCard } from "@tabler/icons-react";
import { WorkflowSheet } from "@/components/workspace/workflow";

export function useBilling(organizationId: string | undefined) {
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) {
      setSummary(null);
      return;
    }
    let active = true;
    setSummary(null);
    setError(null);
    void settingsApi
      .billing(organizationId)
      .then((data) => {
        if (active) setSummary(data);
      })
      .catch((err: unknown) => {
        if (active) setError(getErrorMessage(err, "Unable to load billing"));
      });
    return () => {
      active = false;
    };
  }, [organizationId]);

  async function checkout(plan: BillingSummary["plan"]) {
    if (!organizationId) return;
    setLoading(true);
    setError(null);
    try {
      const returnUrl = window.location.origin + window.location.pathname;
      const result = await settingsApi.checkout(organizationId, plan, returnUrl, returnUrl);
      redirectToCheckout(result);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to start checkout"));
    } finally {
      setLoading(false);
    }
  }

  return { summary, loading, error, checkout };
}

export function BillingContent({ state }: { state: ReturnType<typeof useBilling> }) {
  if (!state.summary) return <BillingState state={state} />;
  return <BillingLoaded state={state} summary={state.summary} />;
}

function BillingState({ state }: { state: ReturnType<typeof useBilling> }) {
  if (state.error)
    return <BillingError message={state.error} onRetry={() => window.location.reload()} />;
  return (
    <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
      Loading billing...
    </div>
  );
}

function BillingLoaded({
  state,
  summary,
}: {
  state: ReturnType<typeof useBilling>;
  summary: BillingSummary;
}) {
  const active = summary.status.toLowerCase() === "active";
  return (
    <div className="space-y-6">
      <BillingOverview summary={summary} active={active} />
      <BillingPlans
        summary={summary}
        active={active}
        loading={state.loading}
        onCheckout={state.checkout}
      />
      {state.error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {state.error}
        </p>
      )}
    </div>
  );
}

function BillingOverview({ summary, active }: { summary: BillingSummary; active: boolean }) {
  return (
    <section className="rounded-[16px] border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Current plan
          </p>
          <h2 className="mt-2 text-2xl font-semibold capitalize tracking-tight">{summary.plan}</h2>
        </div>
        <span className="grid size-11 place-items-center rounded-[12px] bg-primary/10 text-primary">
          <IconCreditCard className="size-5" />
        </span>
      </div>
      <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1 text-xs capitalize">
        <span className={`size-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-amber-500"}`} />
        {summary.status}
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Stat label="Members" value={summary.members + " / " + summary.seatLimit} />
        <Stat label="Agents" value={String(summary.agentLimit)} />
        <Stat label="Subscription" value={active ? "Active" : "Not active"} />
      </div>
    </section>
  );
}

function BillingPlans({
  summary,
  active,
  loading,
  onCheckout,
}: {
  summary: BillingSummary;
  active: boolean;
  loading: boolean;
  onCheckout: (plan: BillingSummary["plan"]) => void;
}) {
  const [selected, setSelected] = useState<BillingSummary["plan"] | null>(null);
  return (
    <SettingsSection
      title="Find your team's fit"
      description="Choose the workspace plan that supports the way your team works."
    >
      <div className="grid gap-4 xl:grid-cols-3">
        {(["starter", "growth", "scale"] as const).map((plan) => (
          <div key={plan} className="space-y-3">
            <PlanCard
              plan={plan}
              current={summary.plan === plan && active}
              loading={loading || summary.checkoutAvailable === false}
              onCheckout={setSelected}
            />
            {summary.plans?.[plan] && (
              <ul className="space-y-2 px-2 text-xs text-muted-foreground">
                <li>{summary.plans[plan].seatLimit} members</li>
                <li>{summary.plans[plan].agentLimit} agents</li>
                <li>Calls up to {summary.plans[plan].callDurationMinutes} minutes</li>
              </ul>
            )}
          </div>
        ))}
      </div>
      {summary.checkoutAvailable === false && (
        <p role="status" className="mt-5 text-sm text-muted-foreground">
          Checkout is not configured. An administrator needs to connect the billing provider before
          a plan can be purchased.
        </p>
      )}
      {selected && (
        <WorkflowSheet
          title={`Choose ${selected}`}
          description="Review the plan before continuing to the provider's secure checkout. Your plan will change only after payment is confirmed."
          onClose={() => setSelected(null)}
        >
          <div className="space-y-5">
            <p className="text-sm">
              Current plan: {summary.plan}. New plan: {selected}.
            </p>
            <p className="text-sm text-muted-foreground">
              Final prices, taxes and billing terms are shown by the provider. No payment is taken
              on this screen.
            </p>
            <button
              disabled={loading}
              className={pagePrimaryAction}
              onClick={() => onCheckout(selected)}
            >
              {loading ? "Opening checkout…" : "Continue to checkout"}
            </button>
          </div>
        </WorkflowSheet>
      )}
    </SettingsSection>
  );
}

function PlanCard({
  plan,
  current,
  loading,
  onCheckout,
}: {
  plan: BillingSummary["plan"];
  current: boolean;
  loading: boolean;
  onCheckout: (plan: BillingSummary["plan"]) => void;
}) {
  return (
    <div
      className={`flex flex-col rounded-[14px] border p-5 ${current ? "border-primary/40 bg-primary/5" : "border-border/70 bg-muted/15"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold capitalize">{plan}</h3>
        {current && <IconCheck className="size-4 text-primary" />}
      </div>
      <p className="mt-3 text-xs leading-6 text-muted-foreground">
        {plan === "starter"
          ? "A foundation for your team's everyday work."
          : plan === "growth"
            ? "More room for a growing team to collaborate."
            : "Workspace capacity for larger organizations."}
      </p>
      <p className="mb-5 mt-3 text-xs leading-5 text-muted-foreground">
        Review pricing and included limits at checkout.
      </p>
      <button
        disabled={loading || current}
        onClick={() => void onCheckout(plan)}
        className={`mt-auto w-full ${current ? pageSecondaryAction : pagePrimaryAction}`}
      >
        {current ? "Current plan" : "Choose plan"}
      </button>
    </div>
  );
}

function redirectToCheckout(result: CheckoutResponse) {
  const url = result.url ?? result.checkoutUrl;
  if (!url) throw new Error("Billing provider did not return a checkout URL");
  if (!["http:", "https:"].includes(new URL(url).protocol))
    throw new Error("Billing provider returned an invalid checkout URL");
  window.location.assign(url);
}

function BillingError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <p className="text-sm text-destructive">{message}</p>
      <button onClick={onRetry} className="mt-4 rounded-md border px-3 h-control py-0 text-sm">
        Retry
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-border/60 bg-card/70 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
