import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { client } from "@/lib/api/client";
import { useOrganization } from "@/lib/organization";
import { SettingsSection, pageSecondaryAction } from "@/components/workspace/page-layout";
import {
  WorkflowSheet,
  WorkflowField,
  WorkflowSubmit,
  WorkflowError,
  useWorkflowMutation,
} from "@/components/workspace/workflow";

export function WorkspaceDanger() {
  const { organization, reset } = useOrganization();
  const navigate = useNavigate();
  const cache = useQueryClient();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const mutation = useWorkflowMutation([], async () => {
    reset();
    cache.clear();
    await navigate({ to: "/workspaces", replace: true });
  });
  if (!organization) return null;
  return (
    <SettingsSection title="Delete workspace">
      <button className={`${pageSecondaryAction} text-destructive`} onClick={() => setOpen(true)}>
        Delete workspace
      </button>
      {open && (
        <WorkflowSheet
          title="Permanently delete workspace"
          onClose={() => {
            if (!mutation.isPending) setOpen(false);
          }}
        >
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (confirmation !== organization.name) return;
              mutation.mutate(() =>
                client.request(`/organization/${organization.id}`, { method: "DELETE" }),
              );
            }}
          >
            <p className="text-sm text-muted-foreground">
              This cannot be undone. Export any data you need and cancel any paid subscription
              first. To confirm, type <strong>{organization.name}</strong>.
            </p>
            <WorkflowField
              label="Workspace name"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              required
              autoComplete="off"
            />
            <WorkflowError error={mutation.error} />
            <WorkflowSubmit
              pending={mutation.isPending || confirmation !== organization.name}
              label="Delete permanently"
            />
          </form>
        </WorkflowSheet>
      )}
    </SettingsSection>
  );
}
