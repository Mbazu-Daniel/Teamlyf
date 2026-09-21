import { useState } from "react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { IconCheck, IconCreditCard, IconReceipt } from "@tabler/icons-react";
import { PageHeader } from "@/components/page-header";
import { Metric, StatusPill } from "@/components/workspace-ui";
import { AppDialog } from "@/components/app-dialog";
import { ResourceState } from "@/components/resource-state";
import { api, organizationPath, useApiResource } from "@/lib/api";
type Billing = {
  plan: string;
  status: string;
  seatLimit: number;
  agentLimit: number;
  members: number;
  hasPaymentMethod: boolean;
  invoices: unknown[];
  currentPeriodEnd: string | null;
};
const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "$0",
    detail: "A focused workspace for a small team.",
  },
  {
    id: "growth",
    name: "Growth",
    price: "$29 / member",
    detail: "More collaborators, automations, and capacity.",
  },
  {
    id: "scale",
    name: "Scale",
    price: "Custom",
    detail: "Advanced governance for growing organizations.",
  },
] as const;
export const Route = createFileRoute("/$tenant/settings/billing")({
  component: BillingPage,
});
function BillingPage() {
  const { tenant } = useParams({ strict: false }) as { tenant: string };
  const billing = useApiResource<Billing>(organizationPath(tenant, "/billing"));
  const [plan, setPlan] = useState<(typeof plans)[number]["id"] | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const current =
    plans.find((item) => item.id === billing.data?.plan) ?? plans[0];
  async function checkout() {
    if (!plan) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await api<{ url?: string }>(
        organizationPath(tenant, "/billing/checkout"),
        {
          method: "POST",
          body: JSON.stringify({
            plan,
            successUrl: window.location.href,
            cancelUrl: window.location.href,
          }),
        },
      );
      if (result.url) window.location.assign(result.url);
      else
        setMessage(
          "Checkout session created. Continue in your billing provider.",
        );
    } catch (reason) {
      setMessage(
        reason instanceof Error ? reason.message : "Unable to start checkout",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        title="Billing & plan"
        description="Choose a plan, understand capacity, and continue securely to your configured payment provider."
        action={
          <button
            onClick={() => setPlan(current.id)}
            className="flex h-9 items-center gap-1.5 rounded-xl border bg-white px-3 text-sm font-semibold"
          >
            <IconCreditCard className="size-4" />
            Manage payment
          </button>
        }
      />
      <ResourceState
        loading={billing.loading}
        error={billing.error}
        onRetry={billing.reload}
      >
        {billing.data && (
          <>
            <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <article className="surface rounded-2xl p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <StatusPill tone="violet">Current plan</StatusPill>
                    <h2 className="mt-3 text-2xl font-semibold">
                      {current.name}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {current.detail}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold">{current.price}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {billing.data.status}
                    </p>
                  </div>
                </div>
                <div className="mt-6 grid gap-2 border-t pt-5 text-sm sm:grid-cols-2">
                  {[
                    "Workspace projects",
                    "Shared docs & notes",
                    `${billing.data.agentLimit} active agents`,
                    "Role-based access",
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-2">
                      <IconCheck className="size-4 text-emerald-600" />
                      {feature}
                    </div>
                  ))}
                </div>
              </article>
              <article className="rounded-2xl bg-slate-900 p-6 text-white">
                <p className="text-sm font-medium text-slate-300">
                  Payment method
                </p>
                <p className="mt-3 text-2xl font-semibold">
                  {billing.data.hasPaymentMethod
                    ? "Configured"
                    : "Not configured"}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Payment details are collected only by your checkout provider.
                  Teamlyf never stores card numbers.
                </p>
                <button
                  onClick={() => setPlan(current.id)}
                  className="mt-6 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900"
                >
                  Update payment method
                </button>
              </article>
            </section>
            <section className="mt-6"><div className="mb-3"><p className="eyebrow">Compare plans</p><h2 className="mt-1 font-semibold">Choose capacity that fits your team</h2></div><div className="grid gap-4 lg:grid-cols-3">{plans.map((item) => <button key={item.id} onClick={() => setPlan(item.id)} className={`surface relative rounded-2xl p-5 text-left transition hover:-translate-y-0.5 ${item.id === current.id ? "border-violet-400 ring-2 ring-violet-100" : "hover:border-violet-300"}`}><StatusPill tone={item.id === current.id ? "violet" : "slate"}>{item.id === current.id ? "Current plan" : "Select plan"}</StatusPill><p className="mt-4 text-lg font-semibold">{item.name}</p><p className="mt-1 text-2xl font-semibold">{item.price}</p><p className="mt-3 min-h-10 text-xs leading-5 text-muted-foreground">{item.detail}</p><span className="mt-5 inline-flex text-xs font-semibold text-violet-700">{item.id === current.id ? "Manage plan" : "Review and continue"}</span></button>)}</div></section>
            <section className="mt-6 grid gap-4 sm:grid-cols-3">
              <Metric
                label="Members"
                value={`${billing.data.members} / ${billing.data.seatLimit}`}
                trend="Current active seats"
              />
              <Metric
                label="Agent capacity"
                value={String(billing.data.agentLimit)}
                trend="Plan allowance"
              />
              <Metric
                label="Billing status"
                value={billing.data.status}
                trend={
                  billing.data.currentPeriodEnd
                    ? `Renews ${new Date(billing.data.currentPeriodEnd).toLocaleDateString()}`
                    : "No active subscription"
                }
              />
            </section>
            <section className="surface mt-6 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Invoices</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Billing provider invoices will appear here after checkout.
                  </p>
                </div>
                <IconReceipt className="size-5 text-violet-600" />
              </div>
              <div className="mt-4 rounded-xl border bg-white p-5 text-center text-sm text-muted-foreground">
                {billing.data.invoices.length
                  ? "Invoices available"
                  : "No invoices are available for this workspace yet."}
              </div>
            </section>
          </>
        )}
      </ResourceState>
      {message && <p className="mt-4 text-sm text-rose-700">{message}</p>}
      {plan && (
        <AppDialog
          title={`Switch to ${plans.find((item) => item.id === plan)?.name}`}
          description="You’ll confirm payment details with your configured provider before any subscription change takes effect."
          onClose={() => setPlan(null)}
        >
          <div className="space-y-3">
            {plans.map((item) => (
              <button
                key={item.id}
                onClick={() => setPlan(item.id)}
                className={`flex w-full items-center justify-between rounded-xl border p-3 text-left ${item.id === plan ? "border-violet-500 bg-violet-50" : "bg-white"}`}
              >
                <span>
                  <strong className="block text-sm">{item.name}</strong>
                  <span className="text-xs text-muted-foreground">
                    {item.detail}
                  </span>
                </span>
                <strong className="text-sm">{item.price}</strong>
              </button>
            ))}
            <button
              disabled={busy}
              onClick={() => void checkout()}
              className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Opening checkout…" : "Continue to secure checkout"}
            </button>
          </div>
        </AppDialog>
      )}
    </>
  );
}
