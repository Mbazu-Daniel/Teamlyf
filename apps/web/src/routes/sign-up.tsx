import { Link, createFileRoute } from "@tanstack/react-router";
import { signUpEmail } from "@/lib/api";
import { usePasswordAuth } from "@/lib/password-auth";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthField } from "@/components/auth/auth-field";
import { SocialSignIn } from "@/components/auth/social-sign-in";

export const Route = createFileRoute("/sign-up")({
  head: () => ({
    meta: [{ title: "Create your Teamlyf account" }],
  }),
  component: SignUp,
});

function SignUp() {
  const { error, pending, submit } = usePasswordAuth(
    (credentials) => signUpEmail(credentials),
    "We could not create your account.",
  );

  return (
    <AuthLayout
      title="Create your account"
      description="Enter your email and password. You can invite your team after you sign up."
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
          placeholder="At least 8 characters"
          autoComplete="new-password"
          minLength={8}
        />

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        <Button className="w-full" type="submit" disabled={pending}>
          {pending ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <SocialSignIn />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/sign-in" className="font-bold text-foreground">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
