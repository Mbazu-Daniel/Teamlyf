import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { IconActivity, IconBell } from "@tabler/icons-react";
import { notificationsApi } from "@/lib/api/notifications";
import { useOrganization } from "@/lib/organization";
import {
  PageHeader,
  ViewToggle,
  WorkspacePage,
  pageSecondaryAction,
} from "@/components/workspace/page-layout";
import { WorkflowError, useWorkflowMutation } from "@/components/workspace/workflow";

export function NotificationBell() {
  const { organization } = useOrganization();
  const query = useQuery({
    queryKey: ["notifications", organization?.id, "inbox", 0],
    queryFn: () => notificationsApi.list(organization!.id),
    enabled: !!organization,
    refetchInterval: 30000,
    retry: false,
  });
  if (!organization) return null;
  const unread = query.data?.items.filter((item) => !item.readAt).length ?? 0;
  return (
    <Link
      to="/$organizationSlug/notifications"
      params={{ organizationSlug: organization.slug || organization.id }}
      aria-label={unread ? `Notifications, ${unread} unread in recent updates` : "Notifications"}
      className="relative grid size-10 shrink-0 place-items-center rounded-xl hover:bg-muted"
    >
      <IconBell className="size-5" />
      {unread > 0 && <span className="absolute right-1 top-1 size-2 rounded-full bg-primary" />}
    </Link>
  );
}

export function NotificationsPage() {
  const { organization } = useOrganization();
  return organization ? (
    <Feed org={organization.id} slug={organization.slug || organization.id} />
  ) : null;
}
function Feed({ org, slug }: { org: string; slug: string }) {
  const [scope, setScope] = useState("inbox"),
    [offset, setOffset] = useState(0),
    [unreadOnly, setUnreadOnly] = useState(false);
  const query = useQuery({
    queryKey: ["notifications", org, scope, offset],
    queryFn: () => notificationsApi.list(org, scope, offset),
    refetchInterval: 30000,
    retry: false,
  });
  const mutation = useWorkflowMutation([["notifications", org]]);
  const items = query.data?.items ?? [];
  return (
    <WorkspacePage>
      <PageHeader
        actions={
          <>
            <ViewToggle
              value={scope}
              onChange={(value) => {
                setScope(value);
                setOffset(0);
                setUnreadOnly(false);
              }}
              ariaLabel="Notification scope"
              options={[
                { value: "inbox", label: "Your inbox", icon: IconBell },
                { value: "activity", label: "Workspace activity", icon: IconActivity },
              ]}
            />
            {scope === "inbox" && (
              <>
                <label className="inline-flex h-control cursor-pointer items-center gap-2 rounded-[10px] border border-border/80 bg-card px-3 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    className="cursor-pointer accent-primary"
                    checked={unreadOnly}
                    onChange={(event) => setUnreadOnly(event.target.checked)}
                  />
                  Unread only
                </label>
                <button
                  disabled={mutation.isPending || !items.some((item) => !item.readAt)}
                  className={pageSecondaryAction}
                  onClick={() =>
                    mutation.mutate(() =>
                      notificationsApi.read(
                        org,
                        items.filter((item) => !item.readAt).map((item) => item.id),
                      ),
                    )
                  }
                >
                  Mark this page read
                </button>
              </>
            )}
            <Link
              className={pageSecondaryAction}
              to="/$organizationSlug/chats/mentions"
              params={{ organizationSlug: slug }}
            >
              Chat mentions
            </Link>
          </>
        }
      />
      <WorkflowError error={query.error ?? mutation.error} />
      {/* Plain surface like Projects: the feed sits on the page background. */}
      <div>
        {query.isPending ? (
          <p className="text-sm">Loading updates…</p>
        ) : (
          <div className="divide-y">
            {items
              .filter((item) => !unreadOnly || !item.readAt)
              .map((item) => (
                <article className="flex items-center gap-4 py-4" key={item.id}>
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/$organizationSlug/projects/$projectId"
                      params={{ organizationSlug: slug, projectId: item.projectId }}
                      search={{ task: item.taskId }}
                      className="text-sm font-medium hover:text-primary"
                    >
                      {item.actor || "A teammate"} {item.verb.replaceAll("_", " ")}
                      {item.field ? ` ${item.field}` : ""} · {item.taskName}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.projectName} · {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {scope === "inbox" && !item.readAt && (
                    <button
                      disabled={mutation.isPending}
                      className={pageSecondaryAction}
                      onClick={() => mutation.mutate(() => notificationsApi.read(org, [item.id]))}
                    >
                      Mark read
                    </button>
                  )}
                </article>
              ))}
            {!query.error && !items.filter((item) => !unreadOnly || !item.readAt).length && (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No matching updates on this page.
              </p>
            )}
          </div>
        )}
      </div>
      <div className="flex gap-3">
        <button
          disabled={!offset}
          className={pageSecondaryAction}
          onClick={() => setOffset(Math.max(0, offset - 50))}
        >
          Previous
        </button>
        <button
          disabled={!query.data?.hasMore}
          className={pageSecondaryAction}
          onClick={() => setOffset(offset + 50)}
        >
          Next
        </button>
      </div>
    </WorkspacePage>
  );
}
