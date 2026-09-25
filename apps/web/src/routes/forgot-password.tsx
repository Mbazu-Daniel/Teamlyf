import { useState, type FormEvent } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { forgotPassword } from "@/lib/api";
import { useAuthAction } from "@/lib/auth-action";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthField } from "@/components/auth/auth-field";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset your Teamlyf password" }] }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { error, pending, run } = useAuthAction(
    (email: string) => forgotPassword({ email, redirectTo: resetLink() }),
    "We could not start the password reset.",
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    if ((await run(email)).ok) setSentTo(email);
  }

  return (
    <AuthLayout
      title="Reset your password"
      description="Enter your email and we will send a link to set a new password."
    >
      {sentTo ? (
        <div role="status" className="space-y-4">
          <p className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm">
            If an account exists for <strong>{sentTo}</strong>, a reset link is on its way.
          </p>
          <Link
            to="/sign-in"
            className="block text-center text-sm font-bold underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={submit}>
          <AuthField
            label="Email"
            name="email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
          />

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <Button className="w-full" size="lg" type="submit" disabled={pending}>
            {pending ? "Sending..." : "Send reset link"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <Link
              to="/sign-in"
              className="font-bold text-foreground underline-offset-4 hover:underline"
            >
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}

/** Where the emailed link lands. Only read on submit, so `window` is safe. */
function resetLink() {
  return `${window.location.origin}/reset-password`;
}
