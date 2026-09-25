import { useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  changePassword,
  listSessions,
  revokeOtherSessions,
  revokeSession,
  type SessionSummary,
} from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { getErrorMessage } from "@/lib/error-message";
import { Button } from "@/components/ui/button";
import { AuthField } from "@/components/auth/auth-field";
import { useAuthAction } from "@/lib/auth-action";

const MIN_PASSWORD_LENGTH = 8;

export function SecuritySettingsPage() {
  return (
    <div className="space-y-6">
      <ChangePasswordCard />
      <SessionsCard />
    </div>
  );
}

function ChangePasswordCard() {
  const queryClient = useQueryClient();
  const { error, pending, run } = useAuthAction(
    (currentPassword: string, newPassword: string) =>
      changePassword({ currentPassword, newPassword, revokeOtherSessions: true }),
    "We could not change your password.",
  );
  const [done, setDone] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Hold the element: `currentTarget` is cleared once dispatch ends, so it is
    // already null by the time the request resolves and the reset below throws.
    const element = event.currentTarget;
    const form = new FormData(element);
    const currentPassword = String(form.get("currentPassword") ?? "");
    const newPassword = String(form.get("newPassword") ?? "");
    if (newPassword !== String(form.get("confirmPassword") ?? "")) {
      setDone("The two new passwords do not match.");
      return;
    }
    setDone(null);
    if ((await run(currentPassword, newPassword)).ok) {
      element.reset();
      setDone("Your password has been changed and other devices were signed out.");
      // Revoking other sessions also rotated this one's cookie.
      await queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
    }
  }

  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-medium">Change password</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Changing your password signs out every other device.
      </p>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <AuthField
          label="Current password"
          name="currentPassword"
          type="password"
          placeholder="Your password"
          autoComplete="current-password"
        />
        <AuthField
          label="New password"
          name="newPassword"
          type="password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
        />
        <AuthField
          label="Confirm new password"
          name="confirmPassword"
          type="password"
          placeholder="Type it again"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
        />

        {error && <FormMessage tone="error">{error}</FormMessage>}
        {!error && done && <FormMessage tone="info">{done}</FormMessage>}

        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Change password"}
        </Button>
      </form>
    </section>
  );
}

function SessionsCard() {
  const { data, isPending, error } = useSessions();

  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-medium">Active sessions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every device signed in to your account. Revoke anything you do not recognise.
          </p>
        </div>
        <SignOutOthersButton />
      </div>

      {error && <FormMessage tone="error">{getErrorMessage(error, "Unable to load sessions")}</FormMessage>}
      {isPending && <p className="mt-5 text-sm text-muted-foreground">Loading sessions...</p>}
      {!isPending && !error && (
        <div className="mt-5 divide-y">
          {(data ?? []).map((session) => (
            <SessionRow key={session.id} session={session} />
          ))}
          {!data?.length && <p className="py-3 text-sm text-muted-foreground">No active sessions.</p>}
        </div>
      )}
    </section>
  );
}

function SessionRow({ session }: { session: SessionSummary }) {
  const queryClient = useQueryClient();
  const revoke = useMutation({
    mutationFn: () => revokeSession(session.token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.sessions }),
  });

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{session.userAgent || "Unknown device"}</p>
        <p className="text-xs text-muted-foreground">
          {session.ipAddress || "Unknown IP"} · started {new Date(session.createdAt).toLocaleString()}
        </p>
      </div>
      <Button
        variant="destructive"
        size="sm"
        disabled={revoke.isPending}
        onClick={() => revoke.mutate()}
      >
        {revoke.isPending ? "Revoking..." : "Revoke"}
      </Button>
      {revoke.error && <FormMessage tone="error">{getErrorMessage(revoke.error, "Unable to revoke this session")}</FormMessage>}
    </div>
  );
}

function SignOutOthersButton() {
  const queryClient = useQueryClient();
  const revoke = useMutation({
    mutationFn: revokeOtherSessions,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.sessions }),
  });

  return (
    <Button variant="outline" size="sm" disabled={revoke.isPending} onClick={() => revoke.mutate()}>
      {revoke.isPending ? "Signing out..." : "Sign out other devices"}
    </Button>
  );
}

function useSessions() {
  return useQuery({ queryKey: queryKeys.sessions, queryFn: listSessions, retry: false });
}

function FormMessage({ tone, children }: { tone: "error" | "info"; children: ReactNode }) {
  const toneClass =
    tone === "error" ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-border bg-muted/30";
  return <p role="alert" className={`rounded-md border p-3 text-sm ${toneClass}`}>{children}</p>;
}
