import { createFileRoute } from "@tanstack/react-router";
import { NotificationsPage } from "@/features/notifications";
export const Route = createFileRoute("/$organizationSlug/notifications")({ component: NotificationsPage });