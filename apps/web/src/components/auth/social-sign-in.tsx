import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiError, signInSocial } from "@/lib/api";

const GOOGLE_MARK = "/icons/google-icon.svg";

const NOT_CONFIGURED =
  "Google sign-in is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env, then restart the API.";

function socialSignInError(reason: unknown): string {
  if (reason instanceof ApiError && (reason.status === 404 || reason.status === 405))
    return NOT_CONFIGURED;
  const detail = reason instanceof Error ? reason.message : "";
  return detail || "Google sign-in is not available.";
}

export function SocialSignIn() {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function start() {
    setMessage("");
    setPending(true);
    try {
      const result = await signInSocial({
        provider: "google",
        callbackURL: `${window.location.origin}/workspaces`,
      });
      if (result?.url) {
        window.location.assign(result.url);
        return;
      }
      setMessage(
        "Google sign-in is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.",
      );
    } catch (reason) {
      setMessage(socialSignInError(reason));
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <div className="my-7 flex items-center gap-4" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span className="text-sm text-muted-foreground">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="auth-outline"
        size="auth"
        className="w-full"
        onClick={start}
        disabled={pending}
      >
        <img src={GOOGLE_MARK} alt="" width={16} height={16} className="size-4" />
        {pending ? "Opening Google..." : "Continue with Google"}
      </Button>

      {message && (
        <p role="status" className="mt-3 text-sm text-muted-foreground">
          {message}
        </p>
      )}
    </div>
  );
}
