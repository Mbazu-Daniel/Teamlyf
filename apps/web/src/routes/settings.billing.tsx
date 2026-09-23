import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { settingsApi, type BillingSummary, type CheckoutResponse } from "@/lib/api";
import { useOrganization } from "@/lib/organization";

type BillingSummary = {
  plan: "starter" | "growth" | "scale";
  status: string;
  seatLimit: number;
  agentLimit: number;
  currentPeriodEnd: string | null;
  members: number;
  provider: string;
  hasSubscription: boolean;
};

type CheckoutResponse = { url?: string; checkoutUrl?: string };

export const Route = createFileRoute("/settings/billing")({ component: BillingSettings });

function BillingSettings() {
  const { organization } = useOrganization();
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organization) return;
    let active = true;
    setSummary(null);
    setError(null);
    void loadBilling(organization.id)
      .then((data) => {
        if (active) setSummary(data);
      })
      .catch((err: unknown) => {
        if (active) setError(getErrorMessage(err, "Unable to load billing"));
      });
    return () => {
      active = false;
    };
  }, [organization?.id]);

  function checkout(plan: BillingSummary["plan"]) {
    if (!organization) return;
    setLoading(true);
    setError(null);
    void startCheckout(organization.id, plan)
      .then((result) => redirectToCheckout(result))
      .catch((err: unknown) => setError(getErrorMessage(err, "Unable to start checkout")))
      .finally(() => setLoading(false));
  }

  if (!organization) return <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">Select an organization before opening settings.</div>;
  return <BillingContent summary={summary} loading={loading} error={error} checkout={checkout} />;
}

function BillingContent({
  summary,
  loading,
  error,
  checkout,
}: {
  summary: BillingSummary | null;
  loading: boolean;
  error: string | null;
  checkout: (plan: BillingSummary["plan"]) => void;
}) {
  if (!summary) return error
    ? <BillingError message={error} onRetry={() => window.location.reload()} />
    : <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">Loading billing...</div>;
  return <BillingLoaded summary={summary} loading={loading} error={error} onCheckout={checkout} />;
}

function BillingLoaded({
  summary,
  loading,
  error,
  onCheckout,
}: {
  summary: BillingSummary;
  loading: boolean;
  error: string | null;
  onCheckout: (plan: BillingSummary["plan"]) => void;
}) {
  return (
    <div className="space-y-6">
      <BillingOverview summary={summary} />
      <BillingPlans summary={summary} loading={loading} onCheckout={onCheckout} />
      <BillingErrorMessage error={error} />
    </div>
  );
}

function BillingErrorMessage({ error }: { error: string | null }) {
  if (!error) return null;
  return <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>;
}

function BillingOverview({ summary }: { summary: BillingSummary }) {
  const active = summary.status.toLowerCase() === "active";
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

function BillingPlans({
  summary,
  loading,
  onCheckout,
}: {
  summary: BillingSummary;
  loading: boolean;
  onCheckout: (plan: BillingSummary["plan"]) => void;
}) {
  const active = summary.status.toLowerCase() === "active";
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-medium">Plans</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {(["starter", "growth", "scale"] as const).map((plan) => (
          <PlanCard key={plan} plan={plan} currentPlan={summary.plan} hasActiveSubscription={active} loading={loading} onCheckout={onCheckout} />
        ))}
      </div>
    </section>
  );
}

function redirectToCheckout(result: CheckoutResponse) {
  const url = result.url ?? result.checkoutUrl;
  if (!url) throw new Error("Billing provider did not return a checkout URL");
  window.location.assign(url);
}

async function loadBilling(orgId: string) {
  return settingsApi.billing(orgId);
}

async function startCheckout(orgId: string, plan: BillingSummary["plan"]) {
  return client.request<CheckoutResponse>("/organization/" + orgId + "/billing/checkout", {
    method: "POST",
    body: JSON.stringify({
      plan,
      successUrl: window.location.origin + "/settings/billing",
      cancelUrl: window.location.origin + "/settings/billing",
    }),
  });
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function BillingError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <p className="text-sm text-destructive">{message}</p>
      <button onClick={onRetry} className="mt-4 rounded-md border px-3 py-2 text-sm">Retry</button>
    </div>
  );
}

function PlanCard({
  plan,
  currentPlan,
  hasActiveSubscription,
  loading,
  onCheckout,
}: {
  plan: BillingSummary["plan"];
  currentPlan: BillingSummary["plan"];
  hasActiveSubscription: boolean;
  loading: boolean;
  onCheckout: (plan: BillingSummary["plan"]) => void;
}) {
  const isCurrentActivePlan = currentPlan === plan && hasActiveSubscription;
  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-medium capitalize">{plan}</h3>
      <p className="mt-2 text-sm text-muted-foreground">Organization plan with its configured agent and seat limits.</p>
      <button disabled={loading || isCurrentActivePlan} onClick={() => void onCheckout(plan)} className="mt-4 w-full rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50">
        {isCurrentActivePlan ? "Current plan" : "Choose plan"}
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-medium">{value}</p></div>;
}
