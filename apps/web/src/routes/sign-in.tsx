import { Link, createFileRoute } from "@tanstack/react-router";
import { signInEmail } from "@/lib/api";
import { usePasswordAuth } from "@/lib/password-auth";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthField } from "@/components/auth/auth-field";
import { SocialSignIn } from "@/components/auth/social-sign-in";

export const Route = createFileRoute("/sign-in")({
  head: () => ({
    meta: [{ title: "Sign in to Teamlyf" }],
  }),
  component: SignIn,
});

function SignIn() {
  const { error, pending, submit } = usePasswordAuth(
    (credentials) => signInEmail(credentials),
    "We could not sign you in.",
  );

  return (
    <AuthLayout
      title="Sign in"
      description="Enter your email and password to open your Teamlyf workspace."
    >
      <form className="space-y-4" onSubmit={submit}>
        <AuthField
          label="Email"
          name="email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
        />
        <AuthField
          label="Password"
          name="password"
          type="password"
          placeholder="Your password"
          autoComplete="current-password"
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
          {pending ? "Signing in..." : "Sign in"}
        </Button>

        <p className="text-center text-sm">
          <Link
            to="/forgot-password"
            className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Forgot your password?
          </Link>
        </p>
      </form>

      <SocialSignIn />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to Teamlyf?{" "}
        <Link to="/sign-up" className="font-bold text-foreground underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
