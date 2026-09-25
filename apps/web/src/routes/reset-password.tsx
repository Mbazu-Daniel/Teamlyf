import { useState, type FormEvent } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { resetPassword } from "@/lib/api";
import { useAuthAction } from "@/lib/auth-action";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthField } from "@/components/auth/auth-field";

export const Route = createFileRoute("/reset-password")({
  // better-auth redirects here with ?token=...&error=...
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
    error: typeof search.error === "string" ? search.error : "",
  }),
  head: () => ({ meta: [{ title: "Choose a new Teamlyf password" }] }),
  component: ResetPassword,
});

const MIN_PASSWORD_LENGTH = 8;

function ResetPassword() {
  const { token, error: linkError } = Route.useSearch();
  const navigate = useNavigate();
  return <ResetPasswordForm token={token} linkError={linkError} onDone={() => navigate({ to: "/sign-in" })} />;
}

/**
 * The page without the router plumbing, so the link states and the mismatch
 * guard can be exercised directly.
 */
export function ResetPasswordForm({
  token,
  linkError,
  onDone,
}: {
  token: string;
  linkError: string;
  onDone: () => void;
}) {
  const [mismatch, setMismatch] = useState<string | null>(null);
  const { error, pending, run } = useAuthAction(
    (newPassword: string, resetToken: string) => resetPassword({ newPassword, token: resetToken }),
    "We could not set your new password.",
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("password") ?? "");
    if (newPassword !== String(form.get("confirmPassword") ?? "")) {
      setMismatch("The two passwords do not match.");
      return;
    }
    setMismatch(null);
    if ((await run(newPassword, token)).ok) onDone();
  }

  if (linkError) return <Notice title="That reset link is no longer valid" detail={linkError} />;
  if (!token) {
    return (
      <Notice
        title="This link is missing its token"
        detail="Open the most recent reset email, or request a new link."
      />
    );
  }

  return (
    <AuthLayout title="Choose a new password" description="Pick something you have not used before.">
      <form className="space-y-4" onSubmit={submit}>
        <AuthField
          label="New password"
          name="password"
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

        {(mismatch ?? error) && (
          <p
            role="alert"
            className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {mismatch ?? error}
          </p>
        )}

        <Button className="w-full" size="lg" type="submit" disabled={pending}>
          {pending ? "Saving..." : "Set new password"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          <Link to="/sign-in" className="font-bold text-foreground underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

/** Terminal state for a link that cannot be used — no form to show. */
function Notice({ title, detail }: { title: string; detail: string }) {
  return (
    <AuthLayout title="Reset your password" description="This link cannot be used to set a new password.">
      <div role="alert" className="space-y-4">
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <strong className="block">{title}</strong>
          {detail}
        </p>
        <Button render={<Link to="/forgot-password" />} variant="outline" className="w-full" size="lg">
          Request a new link
        </Button>
      </div>
    </AuthLayout>
  );
}
