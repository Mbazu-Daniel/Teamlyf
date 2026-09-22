import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
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

export const Route = createFileRoute("/settings/billing")({ component: BillingSettings });

function BillingSettings() {
  const { organization } = useOrganization();
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organization) return;
    void load(organization.id);
  }, [organization?.id]);

  async function load(orgId: string) {
    setError(null);
    try {
      setSummary(await api<BillingSummary>(`/organization/${orgId}/billing`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load billing");
    }
  }

  async function checkout(plan: BillingSummary["plan"]) {
    if (!organization) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api<{ url?: string; checkoutUrl?: string }>(`/organization/${organization.id}/billing/checkout`, {
        method: "POST",
        body: JSON.stringify({
          plan,
          successUrl: `${window.location.origin}/settings/billing`,
          cancelUrl: `${window.location.origin}/settings/billing`,
        }),
      });
      const url = result.url ?? result.checkoutUrl;
      if (!url) throw new Error("Billing provider did not return a checkout URL");
      window.location.assign(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start checkout");
    } finally {
      setLoading(false);
    }
  }

  if (!organization) return <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">Select an organization before opening settings.</div>;
  if (!summary) return <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">Loading billing...</div>;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-card p-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Current plan</p>
        <h2 className="mt-1 text-2xl font-semibold capitalize">{summary.plan}</h2>
        <p className="mt-2 text-sm text-muted-foreground">Status: {summary.status}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Stat label="Members" value={`${summary.members} / ${summary.seatLimit}`} />
          <Stat label="Agents" value={`${summary.agentLimit}`} />
          <Stat label="Subscription" value={summary.hasSubscription ? "Active" : "Not connected"} />
        </div>
      </section>
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-medium">Plans</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {(["starter", "growth", "scale"] as const).map((plan) => (
            <div key={plan} className="rounded-lg border p-4">
              <h3 className="font-medium capitalize">{plan}</h3>
              <p className="mt-2 text-sm text-muted-foreground">Organization plan with its configured agent and seat limits.</p>
              <button disabled={loading || summary.plan === plan} onClick={() => void checkout(plan)} className="mt-4 w-full rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50">{summary.plan === plan ? "Current plan" : "Choose plan"}</button>
            </div>
          ))}
        </div>
      </section>
      {error && <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-medium">{value}</p></div>;
}
