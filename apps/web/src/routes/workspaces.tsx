import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { toast } from "sonner";
import { IconPlus, IconRocket, IconUsers } from "@tabler/icons-react";
import { createOrganization, getOrganizations, type Organization } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { SessionGate } from "@/lib/session";
import { useOrganization } from "@/lib/organization";

export const Route = createFileRoute("/workspaces")({
  component: () => (
    <SessionGate>
      <WorkspacesPage />
    </SessionGate>
  ),
});

const workspaceSchema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters."),
});

const addressSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes.");

/** Turn a display name into the workspace address the API stores. */
function workspaceAddress(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function workspaceHeading(count: number, showCreate: boolean) {
  if (count > 0 && !showCreate) return "Choose a workspace";
  return "Create your first workspace";
}

type WorkspaceQueryState = {
  isPending: boolean;
  isError: boolean;
  refetch: () => unknown;
};

function WorkspaceBody({
  query,
  workspaces,
  showCreate,
  onShowCreate,
  onHideCreate,
}: Readonly<{
  query: WorkspaceQueryState;
  workspaces: Organization[];
  showCreate: boolean;
  onShowCreate: () => void;
  onHideCreate: () => void;
}>) {
  if (query.isPending) return <WorkspaceListSkeleton />;

  if (query.isError) {
    return (
      <div className="empty-state grid gap-3 p-6 text-center">
        <p className="text-sm text-muted-foreground">We could not load your workspaces.</p>
        <button
          type="button"
          onClick={() => void query.refetch()}
          className="justify-self-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-bold transition-colors hover:bg-muted"
        >
          Try again
        </button>
      </div>
    );
  }

  if (showCreate) {
    return (
      <CreateWorkspaceForm
        onDone={onHideCreate}
        canGoBack={workspaces.length > 0}
        onBack={onHideCreate}
      />
    );
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {workspaces.map((workspace) => (
          <WorkspaceTile key={workspace.id} workspace={workspace} />
        ))}
      </div>
      <button
        type="button"
        onClick={onShowCreate}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm font-bold text-muted-foreground transition-colors hover:border-primary-400 hover:text-foreground"
      >
        <IconPlus className="size-4" aria-hidden="true" />
        Create another workspace
      </button>
    </div>
  );
}

function WorkspacesPage() {
  const [creating, setCreating] = useState(false);
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: queryKeys.organizations,
    queryFn: getOrganizations,
    retry: 1,
  });

  const workspaces = data ?? [];
  const showCreate = creating || workspaces.length === 0;

  return (
    <div className="min-h-svh bg-background px-4 py-12 text-foreground">
      <div className="mx-auto w-full max-w-2xl">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold tracking-tight text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="grid size-6 place-items-center rounded-md bg-primary text-primary-foreground">
            <IconRocket className="size-3.5" aria-hidden="true" />
          </span>
          Teamlyf
        </a>

        <h1 className="mt-6 text-3xl font-bold tracking-tight">
          {workspaceHeading(workspaces.length, showCreate)}
        </h1>
        <p className="mt-2 max-w-prose text-muted-foreground">
          A workspace holds your projects, chat and people. Create one to open Teamlyf.
        </p>

        <div className="mt-8">
          <WorkspaceBody
            query={{ isPending, isError, refetch }}
            workspaces={workspaces}
            showCreate={showCreate}
            onShowCreate={() => setCreating(true)}
            onHideCreate={() => setCreating(false)}
          />
        </div>
      </div>
    </div>
  );
}

function WorkspaceTile({ workspace }: Readonly<{ workspace: Organization }>) {
  const navigate = useNavigate();
  const { selectOrganization } = useOrganization();

  function choose() {
    selectOrganization(workspace);
    void navigate({ to: "/projects" });
  }

  return (
    <button
      type="button"
      onClick={choose}
      className="app-card crisp-card flex min-w-0 items-center gap-3 p-4 text-left"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-500/15 text-sm font-bold text-primary-300">
        {workspace.name.slice(0, 1).toUpperCase()}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-bold">{workspace.name}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {workspace.slug || workspace.id}
        </span>
      </span>
    </button>
  );
}

function WorkspaceListSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2" aria-hidden="true">
      {[0, 1].map((index) => (
        <div key={index} className="h-[76px] animate-pulse rounded-xl border border-border bg-card" />
      ))}
    </div>
  );
}

function matchesWorkspace(item: Organization, address: string, name: string) {
  return item.slug === address || item.name === name;
}

async function createWorkspace(name: string, queryClient: QueryClient) {
  const address = workspaceAddress(name);
  if (!addressSchema.safeParse(address).success) {
    throw new Error("That name does not make a valid workspace address.");
  }

  // The create endpoint answers with an empty body, so read the
  // fresh collection instead of trusting the response.
  await createOrganization({ name, slug: address });
  const fresh = await queryClient.fetchQuery({
    queryKey: queryKeys.organizations,
    queryFn: getOrganizations,
  });

  return fresh.find((item) => matchesWorkspace(item, address, name)) ?? fresh[0];
}

function CreateWorkspaceForm({
  onDone,
  canGoBack,
  onBack,
}: Readonly<{ onDone: () => void; canGoBack: boolean; onBack: () => void }>) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { selectOrganization } = useOrganization();

  const form = useForm({
    defaultValues: { name: "" },
    validators: { onSubmit: workspaceSchema },
    onSubmit: async ({ value }) => {
      try {
        const created = await createWorkspace(value.name, queryClient);

        if (!created) {
          toast.error("The workspace was created but could not be opened.");
          onDone();
          return;
        }

        selectOrganization(created);
        toast.success(`${created.name} is ready.`);
        await navigate({ to: "/projects" });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not create the workspace.");
      }
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
      className="app-card grid gap-5 p-6"
    >
      <div className="grid gap-2">
        <form.Field
          name="name"
          children={(field) => (
            <div className="grid gap-2">
              <label htmlFor="workspace-name" className="text-sm font-bold">
                Workspace name
              </label>
              <input
                id="workspace-name"
                name={field.name}
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                placeholder="Acme Inc"
                autoComplete="organization"
                autoFocus
                required
                className="h-11 rounded-xl border border-border bg-background px-3.5 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary-400"
              />
              {field.state.meta.errors.length > 0 ? (
                <p role="alert" className="text-sm text-destructive">
                  {String(field.state.meta.errors[0])}
                </p>
              ) : null}
              {workspaceAddress(field.state.value) ? (
                <p className="text-xs text-muted-foreground">
                  Workspace address:{" "}
                  <span className="font-bold text-foreground">
                    {workspaceAddress(field.state.value)}
                  </span>
                </p>
              ) : null}
            </div>
          )}
        />
      </div>

      <form.Subscribe
        selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
      >
        {({ canSubmit, isSubmitting }) => (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <IconUsers className="size-4" aria-hidden="true" />
              {isSubmitting ? "Creating..." : "Create workspace"}
            </button>
            {canGoBack ? (
              <button
                type="button"
                onClick={onBack}
                className="text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
              >
                Back to workspaces
              </button>
            ) : null}
          </div>
        )}
      </form.Subscribe>
    </form>
  );
}
