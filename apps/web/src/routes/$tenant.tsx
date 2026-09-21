import { Outlet, createFileRoute } from "@tanstack/react-router";
import { WorkspaceShell } from "@/components/workspace-shell";
export const Route = createFileRoute("/$tenant")({ component: () => <WorkspaceShell><Outlet /></WorkspaceShell> });
