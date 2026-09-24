import { useEffect, useState } from "react";
import { settingsApi, type BillingSummary, type CheckoutResponse } from "@/lib/api";

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
    void settingsApi.billing(organizationId)
      .then((data) => { if (active) setSummary(data); })
      .catch((err: unknown) => { if (active) setError(getErrorMessage(err, "Unable to load billing")); });
    return () => { active = false; };
  }, [organizationId]);

  async function checkout(plan: BillingSummary["plan"]) {
    if (!organizationId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await settingsApi.checkout(organizationId, plan, window.location.origin + "/settings/billing", window.location.origin + "/settings/billing");
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
  if (state.error) return <BillingError message={state.error} onRetry={() => window.location.reload()} />;
  return <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">Loading billing...</div>;
}

function BillingLoaded({ state, summary }: { state: ReturnType<typeof useBilling>; summary: BillingSummary }) {
  const active = summary.status.toLowerCase() === "active";
  return (
    <div className="space-y-6">
      <BillingOverview summary={summary} active={active} />
      <BillingPlans summary={summary} active={active} loading={state.loading} onCheckout={state.checkout} />
      {state.error && <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{state.error}</p>}
    </div>
  );
}

function BillingOverview({ summary, active }: { summary: BillingSummary; active: boolean }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">Current plan</p>
      <h2 className="mt-1 text-2xl font-semibold capitalize">{summary.plan}</h2>
      <p className="mt-2 text-sm text-muted-foreground">Status: {summary.status}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Stat label="Members" value={summary.members + " / " + summary.seatLimit} />
        <Stat label="Agents" value={String(summary.agentLimit)} />
        <Stat label="Subscription" value={active ? "Active" : "Not active"} />
      </div>
    </section>
  );
}

function BillingPlans({ summary, active, loading, onCheckout }: { summary: BillingSummary; active: boolean; loading: boolean; onCheckout: (plan: BillingSummary["plan"]) => void }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-medium">Plans</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {(["starter", "growth", "scale"] as const).map((plan) => (
          <PlanCard key={plan} plan={plan} current={summary.plan === plan && active} loading={loading} onCheckout={onCheckout} />
        ))}
      </div>
    </section>
  );
}

function PlanCard({ plan, current, loading, onCheckout }: { plan: BillingSummary["plan"]; current: boolean; loading: boolean; onCheckout: (plan: BillingSummary["plan"]) => void }) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-medium capitalize">{plan}</h3>
      <p className="mt-2 text-sm text-muted-foreground">Organization plan with its configured agent and seat limits.</p>
      <button disabled={loading || current} onClick={() => void onCheckout(plan)} className="mt-4 w-full rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50">
        {current ? "Current plan" : "Choose plan"}
      </button>
    </div>
  );
}

function redirectToCheckout(result: CheckoutResponse) {
  const url = result.url ?? result.checkoutUrl;
  if (!url) throw new Error("Billing provider did not return a checkout URL");
  window.location.assign(url);
}

function BillingError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="rounded-xl border bg-card p-6"><p className="text-sm text-destructive">{message}</p><button onClick={onRetry} className="mt-4 rounded-md border px-3 py-2 text-sm">Retry</button></div>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-medium">{value}</p></div>;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
