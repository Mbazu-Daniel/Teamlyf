import { createFileRoute } from "@tanstack/react-router";
import { BillingContent, useBilling } from "@/features/settings/billing";
import { useOrganization } from "@/lib/organization";

export const Route = createFileRoute("/_app/settings/billing")({ component: BillingRoute });

function BillingRoute() {
  const { organization } = useOrganization();
  const state = useBilling(organization?.id);

  if (!organization) return <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">Select an organization before opening settings.</div>;
  return <BillingContent state={state} />;
}
