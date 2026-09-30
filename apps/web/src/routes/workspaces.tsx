import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { toast } from "sonner";
import { IconArrowUpRight, IconLogout, IconPlus, IconUsers } from "@tabler/icons-react";
import { createOrganization, getOrganizations, signOut, type Organization } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { SessionGate, useResetSession } from "@/lib/session";
import { useOrganization } from "@/lib/organization";
import { Brand } from "@/components/ui/brand";
import { ReceivedInvitations } from "@/features/settings/received-invitations";

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
          className="justify-self-center rounded-lg border border-border bg-card px-4 h-control py-0 text-sm font-bold transition-colors hover:bg-muted"
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
        className="inline-flex h-control items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm font-bold text-muted-foreground transition-colors hover:border-primary-400 hover:text-foreground"
      >
        <IconPlus className="size-4" aria-hidden="true" />
        Create another workspace
      </button>
    </div>
  );
}

function WorkspacesPage() {
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const resetSession = useResetSession();
  const { reset: resetWorkspace } = useOrganization();
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: queryKeys.organizations,
    queryFn: getOrganizations,
    retry: 1,
  });

  const workspaces = data ?? [];
  const showCreate = creating || workspaces.length === 0;

  async function handleSignOut() {
    try {
      await signOut();
    } finally {
      resetSession();
      resetWorkspace();
      await navigate({ to: "/sign-in" });
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border/70 bg-card px-5 sm:px-8 lg:px-12">
        <Brand />
        <div className="ml-auto flex items-center gap-3">
          <Link to="/account" className="text-sm font-medium text-primary">
            Your account
          </Link>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="inline-flex h-control shrink-0 items-center gap-1.5 rounded-full px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <IconLogout className="size-4" aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center bg-gradient-to-b from-primary/[0.04] to-background px-4 py-12 sm:px-6 lg:py-20">
        <div className="w-full max-w-3xl">
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            Your Teamlyf
          </p>
          <h1 className="mt-3 text-center text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
            {workspaceHeading(workspaces.length, showCreate)}
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm leading-6 text-muted-foreground">
            A workspace holds your projects, chat and people. Create one to open Teamlyf.
          </p>

          <ReceivedInvitations />
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
      </main>
    </div>
  );
}

function WorkspaceTile({ workspace }: Readonly<{ workspace: Organization }>) {
  const navigate = useNavigate();
  const { selectOrganization } = useOrganization();

  function choose() {
    selectOrganization(workspace);
    void navigate({
      to: "/$organizationSlug/projects",
      params: { organizationSlug: workspace.slug || workspace.id },
    });
  }

  return (
    <button
      type="button"
      onClick={choose}
      className="group flex min-w-0 items-center gap-4 rounded-[14px] border border-border/70 bg-card p-6 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-[12px] bg-gradient-to-br from-primary to-primary/70 text-lg font-medium text-primary-foreground">
        {workspace.name.slice(0, 1).toUpperCase()}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">{workspace.name}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {workspace.slug || workspace.id}
        </span>
      </span>
      <IconArrowUpRight className="ml-auto size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
    </button>
  );
}

function WorkspaceListSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2" aria-hidden="true">
      {[0, 1].map((index) => (
        <div
          key={index}
          className="h-[76px] animate-pulse rounded-xl border border-border bg-card"
        />
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

  await createOrganization({ name, slug: address });
  const fresh = await getOrganizations();
  queryClient.setQueryData(queryKeys.organizations, fresh);

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
        await navigate({
          to: "/$organizationSlug/projects",
          params: { organizationSlug: created.slug || created.id },
        });
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
      className="mx-auto grid max-w-xl gap-5 rounded-[16px] border border-border/70 bg-card p-6 sm:p-8"
    >
      <div className="grid gap-2">
        <form.Field
          name="name"
          children={(field) => (
            <div className="grid gap-2">
              <label htmlFor="workspace-name" className="text-xs font-medium">
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
                className="h-control rounded-[12px] border border-border/80 bg-muted/30 px-4 text-sm font-normal text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:bg-card focus:ring-2 focus:ring-primary/10"
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
              className="inline-flex h-control items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
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
