import { createFileRoute } from "@tanstack/react-router";
import { SecuritySettingsPage } from "@/features/settings/security";

export const Route = createFileRoute("/_app/settings/security")({
  component: SecuritySettingsRoute,
});

function SecuritySettingsRoute() {
  return <SecuritySettingsPage />;
}
